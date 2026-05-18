-- =============================================
-- MIGRATION 005: Help, Tour, Templates, Scheduling
-- =============================================

-- --------------------------
-- HELP FAQs
-- --------------------------
CREATE TABLE IF NOT EXISTS help_faqs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text NOT NULL,
  question    text NOT NULL,
  answer      text NOT NULL,
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- --------------------------
-- SUPPORT TICKETS
-- --------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id),
  subject     text NOT NULL,
  category    text NOT NULL DEFAULT 'Other',
  priority    text NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  status      text NOT NULL DEFAULT 'open',
  device_info jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id   uuid REFERENCES users(id),
  message   text NOT NULL,
  is_admin  boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- --------------------------
-- USER TOUR STATUS
-- --------------------------
CREATE TABLE IF NOT EXISTS user_tour_status (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  business_id     uuid REFERENCES businesses(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'not_started',
  completed_steps integer[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- --------------------------
-- TEMPLATES
-- --------------------------
CREATE TABLE IF NOT EXISTS templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  type        text NOT NULL,
  name        text NOT NULL,
  subject     text,
  body        text NOT NULL,
  variables   text[] DEFAULT '{}',
  is_system   boolean DEFAULT false,
  is_active   boolean DEFAULT true,
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- --------------------------
-- SCHEDULING SLOTS
-- --------------------------
CREATE TABLE IF NOT EXISTS scheduling_slots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid REFERENCES businesses(id) ON DELETE CASCADE,
  created_by   uuid REFERENCES users(id),
  slot_date    date NOT NULL,
  start_time   time,
  end_time     time,
  purpose      text,
  meeting_type text DEFAULT 'Consultation',
  location     text,
  notes        text,
  time_zone    text DEFAULT 'America/New_York',
  repeat_option text DEFAULT 'none',
  status       text NOT NULL DEFAULT 'available',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- --------------------------
-- BOOKING LINKS
-- --------------------------
CREATE TABLE IF NOT EXISTS booking_links (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           uuid REFERENCES businesses(id) ON DELETE CASCADE,
  created_by            uuid REFERENCES users(id),
  token                 text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  title                 text NOT NULL,
  purpose               text,
  contact_id            uuid REFERENCES contacts(id) ON DELETE SET NULL,
  expiry_date           date,
  internal_notes        text,
  message_to_recipient  text,
  status                text NOT NULL DEFAULT 'active',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_link_slots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_link_id uuid REFERENCES booking_links(id) ON DELETE CASCADE,
  slot_id         uuid REFERENCES scheduling_slots(id) ON DELETE CASCADE,
  UNIQUE(booking_link_id, slot_id)
);

-- --------------------------
-- SCHEDULED MEETINGS
-- --------------------------
CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid REFERENCES businesses(id) ON DELETE CASCADE,
  booking_link_id     uuid REFERENCES booking_links(id) ON DELETE SET NULL,
  slot_id             uuid REFERENCES scheduling_slots(id) ON DELETE SET NULL,
  contact_id          uuid REFERENCES contacts(id) ON DELETE SET NULL,
  guest_name          text,
  guest_email         text,
  guest_phone         text,
  guest_message       text,
  purpose             text,
  notes               text,
  status              text NOT NULL DEFAULT 'scheduled',
  email_sent_to_guest boolean DEFAULT false,
  email_sent_to_user  boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- --------------------------
-- INDEXES
-- --------------------------
CREATE INDEX IF NOT EXISTS idx_support_tickets_business ON support_tickets(business_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_user_tour_status_user ON user_tour_status(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_business ON templates(business_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_scheduling_slots_business ON scheduling_slots(business_id);
CREATE INDEX IF NOT EXISTS idx_booking_links_business ON booking_links(business_id);
CREATE INDEX IF NOT EXISTS idx_booking_links_token ON booking_links(token);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_business ON scheduled_meetings(business_id);

-- =============================================
-- SEED: FAQ DATA
-- =============================================

INSERT INTO help_faqs (category, question, answer, sort_order) VALUES

-- Getting Started
('Getting Started', 'What is Clear Build USA?', 'Clear Build USA is a business management platform built for contractors and trade businesses. It helps you manage contacts, quotes, projects, invoices, payments, and team communication in one place.', 1),
('Getting Started', 'How do I create my first quote?', 'Go to Quotes in the sidebar and click "New Quote". Select a contact, add line items, set the valid-until date, and save. You can then send it to your customer with a review link.', 2),
('Getting Started', 'How do I create a project?', 'Go to Projects and click "New Project". Fill in the project name, assign a contact, set a budget and timeline, and save. Projects can be linked to quotes and invoices.', 3),
('Getting Started', 'Can I have multiple businesses?', 'Yes. You can create or join multiple businesses. Use the Business Switcher in the top bar to switch between them. Each business has its own separate data.', 4),
('Getting Started', 'Is there a mobile app?', 'Clear Build USA is a mobile-responsive web app. Open it in your phone browser for an app-like experience with bottom navigation. You can add it to your home screen for quick access.', 5),

-- Account & Login
('Account & Login', 'Why do I need to verify my email?', 'Email verification ensures your account is secure and that you can receive important notifications about quotes, invoices, and team activity.', 1),
('Account & Login', 'I forgot my password. How do I reset it?', 'Click "Forgot?" on the login page and enter your email. You will receive a password reset link within a few minutes. Check your spam folder if you don''t see it.', 2),
('Account & Login', 'How do I change my email address?', 'Currently, email changes require contacting support. Submit a support ticket with your current and new email address.', 3),
('Account & Login', 'Can multiple people log in with the same account?', 'No. Each team member should have their own account. Use the Team Invitations feature to invite colleagues to your business.', 4),

-- Business Setup
('Business Setup', 'How do I set up my business profile?', 'After registration, you will be guided through the Business Setup flow. You can also update your business details anytime in Settings > Business Profile.', 1),
('Business Setup', 'How do I set my quote and invoice prefixes?', 'Go to Settings > Tax & Numbering. You can set custom prefixes for quotes (e.g. Q-), invoices (e.g. INV-), and projects (e.g. PRJ-). Numbers auto-increment.', 2),
('Business Setup', 'Can I upload a business logo?', 'Yes. Go to Settings > Business Profile and upload a PNG or JPG logo (max 2 MB). It will appear on your quotes and invoices.', 3),

-- Contacts & Customers
('Contacts & Customers', 'What is the difference between a Lead and a Customer?', 'Leads are potential clients you are still working to close. Customers are confirmed clients. You can convert a Lead to a Customer once the deal is won.', 1),
('Contacts & Customers', 'How do I convert a lead to a customer?', 'Open the contact, click the Actions menu, and select "Convert to Customer". The contact type updates immediately.', 2),
('Contacts & Customers', 'Can I import contacts from another system?', 'Bulk import is not yet available. You can add contacts one at a time through the Contacts page. Contact support for bulk import assistance.', 3),
('Contacts & Customers', 'How do I track lead status?', 'Each contact has a Lead Status field. You can set it to: New Lead, In Conversation, Meeting Scheduled, Site Visit, Proposal Sent, Negotiation, Won, or Lost.', 4),

-- Quotes
('Quotes', 'How do I send a quote to a customer?', 'Open the quote and click "Send". This generates a unique review link and emails it to the customer. They can view, approve, or reject the quote online.', 1),
('Quotes', 'Can a customer approve a quote online?', 'Yes. When you send a quote, the customer receives an email with a link to view and approve it. Their approval is logged and you are notified.', 2),
('Quotes', 'What happens after a quote is approved?', 'The quote status changes to "Approved". You can then create an invoice directly from the quote or create a linked project.', 3),
('Quotes', 'How do I add optional line items?', 'When adding a line item to a quote, check the "Optional" checkbox. Optional items are shown to the customer but not included in the base total.', 4),

-- Projects
('Projects', 'How do I link a project to a quote or invoice?', 'When creating an invoice or quote, you can select an existing project from the Project dropdown. Projects can also be linked when creating them.', 1),
('Projects', 'What project statuses are available?', 'Projects can be: Active, Scheduled, On Hold, or Completed. Update the status from the project detail page.', 2),
('Projects', 'How do I track project updates?', 'Go to Project Updates in the sidebar. You can log notes, progress updates, and milestones for any project.', 3),

-- Invoices & Payments
('Invoices & Payments', 'How do I send an invoice to a customer?', 'Open the invoice and click "Send Invoice". This emails the invoice details to the customer. The invoice status updates to "Sent".', 1),
('Invoices & Payments', 'How do I record a payment?', 'Go to the Payments page or open an invoice and click "Record Payment". Enter the amount, date, and payment method.', 2),
('Invoices & Payments', 'Why can I not edit a sent invoice?', 'Once an invoice is sent, line items and pricing are locked to maintain financial integrity. To make changes, duplicate the invoice and send a new one.', 3),
('Invoices & Payments', 'What payment methods can I record?', 'You can record Cash, Check, Bank Transfer, Credit Card, or Other payments. These are for record-keeping purposes within the app.', 4),
('Invoices & Payments', 'How do I see how much a customer owes?', 'Open the contact page. It shows the lifetime value and linked invoices. The invoice detail page shows amount due vs amount received.', 5),

-- Notifications & Communications
('Notifications & Communications', 'How do I send a message to a customer?', 'Go to Communications and use the "Send Notification" option. You can send via Email, SMS draft, or WhatsApp draft. Templates are available to save time.', 1),
('Notifications & Communications', 'How do WhatsApp and SMS messages work?', 'Clicking WhatsApp or SMS opens a pre-filled draft in your phone app. You send it directly from your device. This keeps your number private.', 2),
('Notifications & Communications', 'Can I create message templates?', 'Yes. Go to the Templates page to create and manage reusable message templates for notifications, communications, quotes, and invoices.', 3),

-- Team Management
('Team Management', 'How do I invite a team member?', 'Go to Team and click "Invite Member". Enter their email and select a role. They will receive an invitation email.', 1),
('Team Management', 'What roles are available?', 'Owner, Manager, Staff, Crew, and Viewer. Each role has different access levels. Owners have full access. Viewers have read-only access.', 2),
('Team Management', 'Can I remove a team member?', 'Yes. Open the team member and click "Remove". They will immediately lose access to the business. You can re-invite them later.', 3),

-- Subscription & Billing
('Subscription & Billing', 'How long is the free trial?', 'The free trial is 15 days. No credit card is required to start. You can access all features during the trial period.', 1),
('Subscription & Billing', 'What happens when the trial ends?', 'After the trial ends, you can still log in and view your existing data. Creating, editing, or sending records requires an active subscription.', 2),
('Subscription & Billing', 'How do I upgrade to a paid plan?', 'Go to the Subscription page and select a Monthly or Yearly plan. You will be redirected to the Stripe checkout page to enter payment details.', 3),
('Subscription & Billing', 'Can I cancel my subscription?', 'Yes. Click "Open Billing Portal" on the Subscription page to manage, change, or cancel your subscription through the Stripe portal.', 4),

-- Scheduling / Bookings
('Scheduling / Bookings', 'What is the Scheduling feature?', 'Scheduling lets you create available time slots and share booking links with contacts. When a customer books a slot, you both receive confirmation emails and the meeting appears in your Scheduled Meetings list.', 1),
('Scheduling / Bookings', 'How do I create a booking link?', 'Go to Scheduling > Booking Links and click "Create Link". Select the available slots you want to offer, optionally link a contact, and generate the link. You can share it via email, WhatsApp, or SMS.', 2),
('Scheduling / Bookings', 'Does the customer need an account to book?', 'No. The booking page is public. If you pre-selected a contact, their info is pre-filled. Otherwise, the customer enters their name, email, and phone before selecting a slot.', 3),

-- Troubleshooting
('Troubleshooting', 'Verification email not received', 'Check your spam or junk folder. Make sure you entered the correct email. Wait up to 5 minutes. You can request a resend from the login page by clicking "Resend verification email".', 1),
('Troubleshooting', 'Data not showing after switching business', 'After switching, the page reloads with data for the selected business. If data is missing, refresh the page. Each business shows only its own data.', 2),
('Troubleshooting', 'Invoice email not sent', 'Check that the contact has a valid email address. Check your Resend API key in environment settings. If email is not configured, emails are logged to the console only.', 3),
('Troubleshooting', 'Payment not updating invoice balance', 'Refresh the invoice page after recording a payment. The balance due recalculates from all linked payment records. Make sure the payment was linked to the correct invoice.', 4),
('Troubleshooting', 'Quote approval link not opening', 'The quote must be in "Sent" status for the review link to work. If the quote was re-saved to Draft, resend it. Links use the quote ID and are permanently valid unless the quote is deleted.', 5);


-- =============================================
-- SEED: SYSTEM TEMPLATES
-- business_id = NULL means system/global template
-- =============================================

INSERT INTO templates (business_id, type, name, subject, body, variables, is_system) VALUES

-- Notification Templates
(NULL, 'notification', 'Welcome Message', 'Welcome to {{business_name}}!',
'Hi {{contact_name}}, welcome! We''re excited to work with you at {{business_name}}. Feel free to reach out if you have any questions.',
ARRAY['contact_name','business_name'], true),

(NULL, 'notification', 'Appointment Reminder', 'Reminder: Your appointment with {{business_name}}',
'Hi {{contact_name}}, this is a reminder about your upcoming appointment with {{business_name}}. Please contact us if you need to reschedule.',
ARRAY['contact_name','business_name'], true),

(NULL, 'notification', 'Quote Follow-up', 'Following up on your quote from {{business_name}}',
'Hi {{contact_name}}, just following up on the quote we sent you. Let us know if you have any questions or if you''d like to move forward. Quote #{{quote_number}}.',
ARRAY['contact_name','business_name','quote_number'], true),

(NULL, 'notification', 'Invoice Payment Reminder', 'Invoice {{invoice_number}} — Payment Due {{due_date}}',
'Hi {{contact_name}}, this is a friendly reminder that invoice {{invoice_number}} for {{amount_due}} is due on {{due_date}}. Please contact us if you have questions.',
ARRAY['contact_name','invoice_number','amount_due','due_date'], true),

(NULL, 'notification', 'Project Update', 'Update on your project — {{project_name}}',
'Hi {{contact_name}}, we wanted to share an update on {{project_name}}. Please log in or reach out if you have any questions.',
ARRAY['contact_name','project_name','business_name'], true),

(NULL, 'notification', 'Feedback Request', 'How did we do? — {{business_name}}',
'Hi {{contact_name}}, thank you for choosing {{business_name}}! We''d love to hear your feedback. Please click here: {{feedback_link}}',
ARRAY['contact_name','business_name','feedback_link'], true),

(NULL, 'notification', 'Thank You Message', 'Thank you from {{business_name}}',
'Hi {{contact_name}}, thank you for your business! It was a pleasure working with you. We look forward to helping you again.',
ARRAY['contact_name','business_name'], true),

(NULL, 'notification', 'Trial Expiry Reminder', 'Your {{business_name}} trial ends soon',
'Hi {{contact_name}}, your free trial with {{business_name}} ends soon. Upgrade now to keep access to all features.',
ARRAY['contact_name','business_name'], true),

-- Communication Templates
(NULL, 'communication', 'Lead Follow-up', 'Following up on your inquiry',
'Hi {{contact_name}}, thank you for your interest in {{business_name}}. I wanted to follow up on your inquiry. When would be a good time to connect?',
ARRAY['contact_name','business_name'], true),

(NULL, 'communication', 'Customer Follow-up', 'Checking in — {{business_name}}',
'Hi {{contact_name}}, I''m reaching out to check in and see how everything is going. Please don''t hesitate to reach out if you need anything.',
ARRAY['contact_name','business_name'], true),

(NULL, 'communication', 'Site Visit Confirmation', 'Site Visit Confirmed — {{project_name}}',
'Hi {{contact_name}}, your site visit for {{project_name}} is confirmed. We look forward to meeting with you. Please let us know if anything changes.',
ARRAY['contact_name','project_name','business_name'], true),

(NULL, 'communication', 'Meeting Reminder', 'Reminder: Meeting with {{business_name}}',
'Hi {{contact_name}}, this is a reminder about your scheduled meeting with {{business_name}}. See you soon!',
ARRAY['contact_name','business_name'], true),

(NULL, 'communication', 'Payment Received', 'Payment Received — Thank You!',
'Hi {{contact_name}}, we have received your payment. Thank you! Please keep this message for your records.',
ARRAY['contact_name','business_name'], true),

(NULL, 'communication', 'Project Completion Message', 'Your project is complete — {{project_name}}',
'Hi {{contact_name}}, we are pleased to let you know that {{project_name}} is complete. It was a pleasure working with you. Thank you for choosing {{business_name}}!',
ARRAY['contact_name','project_name','business_name'], true),

(NULL, 'communication', 'Review Request', 'Could you leave us a review?',
'Hi {{contact_name}}, we hope you are happy with our work! If you have a moment, we would really appreciate a review. Your feedback means a lot to {{business_name}}.',
ARRAY['contact_name','business_name'], true),

-- Quote Templates
(NULL, 'quote', 'Basic Service Quote', 'Quote for Services — {{business_name}}',
'Thank you for the opportunity to work with you. Please find our quote for services below. This quote is valid for 30 days. Contact us with any questions.',
ARRAY['contact_name','business_name','quote_number'], true),

(NULL, 'quote', 'Kitchen Remodel Quote', 'Kitchen Remodel Quote — {{business_name}}',
'Thank you for considering {{business_name}} for your kitchen remodel. We have prepared a detailed quote based on our site assessment. All materials and labor are included as specified.',
ARRAY['contact_name','business_name','quote_number'], true),

(NULL, 'quote', 'Bathroom Remodel Quote', 'Bathroom Remodel Quote — {{business_name}}',
'Please find our quote for your bathroom remodel project. We use quality materials and our work is fully warrantied. We look forward to transforming your space.',
ARRAY['contact_name','business_name','quote_number'], true),

(NULL, 'quote', 'Labor + Materials Quote', 'Labor & Materials Estimate — {{business_name}}',
'This quote covers labor and materials as discussed. Any additional scope changes will be documented as a change order before work proceeds.',
ARRAY['contact_name','business_name','quote_number'], true),

(NULL, 'quote', 'Deposit Quote', 'Deposit Required — {{business_name}}',
'To secure your project start date, a deposit is required. The balance is due upon project completion. Thank you for choosing {{business_name}}.',
ARRAY['contact_name','business_name','quote_number'], true),

-- Invoice Templates
(NULL, 'invoice', 'Standard Invoice', 'Invoice {{invoice_number}} from {{business_name}}',
'Please find your invoice attached. Payment is due by {{due_date}}. Thank you for your business.',
ARRAY['contact_name','business_name','invoice_number','due_date','amount_due'], true),

(NULL, 'invoice', 'Deposit Invoice', 'Deposit Invoice {{invoice_number}} — {{business_name}}',
'This invoice covers the agreed deposit to begin your project. The remaining balance will be invoiced upon completion.',
ARRAY['contact_name','business_name','invoice_number','amount_due'], true),

(NULL, 'invoice', 'Progress Payment Invoice', 'Progress Payment — {{project_name}}',
'This invoice represents a progress payment milestone for {{project_name}}. Thank you for your continued partnership.',
ARRAY['contact_name','business_name','invoice_number','project_name','amount_due'], true),

(NULL, 'invoice', 'Final Invoice', 'Final Invoice — {{project_name}}',
'Thank you for choosing {{business_name}}. This is your final invoice for {{project_name}}. It has been a pleasure working with you.',
ARRAY['contact_name','business_name','invoice_number','project_name','amount_due'], true),

(NULL, 'invoice', 'Past Due Reminder', 'Past Due: Invoice {{invoice_number}}',
'This is a reminder that invoice {{invoice_number}} for {{amount_due}} is past due. Please arrange payment as soon as possible or contact us to discuss payment options.',
ARRAY['contact_name','business_name','invoice_number','amount_due','due_date'], true),

(NULL, 'invoice', 'Payment Received Confirmation', 'Payment Confirmed — {{business_name}}',
'Your payment has been received. Thank you! Invoice {{invoice_number}} is now marked as paid. Please keep this confirmation for your records.',
ARRAY['contact_name','business_name','invoice_number'], true);
