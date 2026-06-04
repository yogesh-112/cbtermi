const XLSX = require('xlsx');
const path = require('path');

// ── helpers ──────────────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

function addSheet(name, rows, colWidths) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  if (colWidths) ws['!cols'] = colWidths.map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, name);
}

// ── SHEET 1 : INSTRUCTIONS ───────────────────────────────────────────────────
addSheet('README', [
  ['Clear Build USA — QA Testing Process & Tracker'],
  ['Version 1.0 | May 2026 | Test on: https://clearbuildusa.com'],
  [],
  ['SHEET', 'PURPOSE'],
  ['README', 'This page — how to use the workbook'],
  ['Browser-Device Matrix', 'Test each browser × device combination'],
  ['UI-UX Checklist', 'Global design checks (colors, hover, spacing, etc.)'],
  ['Test Cases', '220+ test cases across all 22 modules — fill Actual Result & Status'],
  ['Bug Reports', 'Log one row per bug found — fill in details'],
  ['Daily Report', 'End-of-day summary — fill one row per testing day'],
  ['Final Summary', 'Module totals and launch go/no-go decision'],
  [],
  ['HOW TO USE'],
  ['1. Start with the Test Cases sheet — work top to bottom, module by module.'],
  ['2. For every test: write what actually happened in "Actual Result" column.'],
  ['3. Set Status to: PASS / FAIL / SKIP / N/A'],
  ['4. For every FAIL: add a row to the Bug Reports sheet immediately.'],
  ['5. At end of each day: fill one row in the Daily Report sheet.'],
  ['6. When all testing is done: fill the Final Summary sheet.'],
  [],
  ['STATUS DEFINITIONS'],
  ['PASS', 'Result matches expected — feature works correctly'],
  ['FAIL', 'Result does NOT match expected — bug found'],
  ['SKIP', 'Could not run the test (write reason in Notes)'],
  ['N/A', 'Not applicable to current configuration'],
  [],
  ['PRIORITY DEFINITIONS'],
  ['P1 CRITICAL', 'App unusable, data loss risk, or security vulnerability — block launch'],
  ['P2 HIGH', 'Major feature broken, blocks normal user workflow'],
  ['P3 MEDIUM', 'Feature partially broken — workaround exists'],
  ['P4 LOW', 'Minor cosmetic issue, typo, spacing, or colour mismatch'],
  [],
  ['STRIPE TEST CARD (for payment tests)'],
  ['Card Number', '4242 4242 4242 4242'],
  ['Expiry', 'Any future date (e.g. 12/28)'],
  ['CVC', 'Any 3 digits'],
  ['Name / ZIP', 'Any value'],
], [30, 80]);

// ── SHEET 2 : BROWSER × DEVICE MATRIX ────────────────────────────────────────
const compatHeader = [
  'Browser / Version',
  'Windows 11 Desktop',
  'macOS Desktop',
  'iPad Safari',
  'Android Tablet',
  'iPhone Safari',
  'Android Phone',
  'Notes',
];
const compatRows = [
  compatHeader,
  ['Chrome (latest)', '', '', '', '', '', '', ''],
  ['Firefox (latest)', '', '', '—', '', '—', '', ''],
  ['Safari (latest)', '—', '', '', '—', '', '—', ''],
  ['Edge (latest)', '', '', '', '', '', '', ''],
  ['Chrome Mobile', '—', '—', '', '', '', '', ''],
  [],
  ['SCREEN SIZE / RESPONSIVE BREAKPOINTS'],
  ['Viewport', 'Width (px)', 'Sidebar visible?', 'Tables readable?', 'Modals fit screen?', 'Forms usable?', 'Buttons tappable?', 'Overall Status'],
  ['Large Desktop', '1440+', '', '', '', '', '', ''],
  ['Standard Desktop', '1280', '', '', '', '', '', ''],
  ['Small Desktop', '1024', '', '', '', '', '', ''],
  ['Tablet Landscape', '1024', '', '', '', '', '', ''],
  ['Tablet Portrait', '768', '', '', '', '', '', ''],
  ['Mobile Large', '430', '', '', '', '', '', ''],
  ['Mobile Standard', '390', '', '', '', '', '', ''],
  ['Mobile Small', '375', '', '', '', '', '', ''],
];
addSheet('Browser-Device Matrix', compatRows, [22, 20, 18, 16, 16, 16, 16, 30]);

// ── SHEET 3 : UI/UX CHECKLIST ────────────────────────────────────────────────
addSheet('UI-UX Checklist', [
  ['Clear Build USA — Global UI/UX Checklist'],
  ['Run these checks across ALL pages before marking UI/UX as complete.'],
  [],
  ['#', 'Category', 'Check Item', 'Status (PASS/FAIL/SKIP)', 'Notes'],
  // Brand Colors
  ['C-01', 'Brand Colors', 'Navy #16265a used for headings, sidebar, primary text', '', ''],
  ['C-02', 'Brand Colors', 'Green #3FA66B used for primary CTA buttons and success states', '', ''],
  ['C-03', 'Brand Colors', 'Blue #2453E4 used for links and secondary actions', '', ''],
  ['C-04', 'Brand Colors', 'Background is #f6f6f3 (warm off-white) across all pages', '', ''],
  ['C-05', 'Brand Colors', 'Card borders are #e7e6e1 (light gray)', '', ''],
  ['C-06', 'Brand Colors', 'No incorrect colors used (e.g. red button where green expected)', '', ''],
  // Typography
  ['T-01', 'Typography', 'Font is Inter (clean sans-serif) on all pages', '', ''],
  ['T-02', 'Typography', 'Page titles are large, bold, navy colored', '', ''],
  ['T-03', 'Typography', 'Body text is readable at standard screen size', '', ''],
  ['T-04', 'Typography', 'No text overflow or unintended truncation on standard screens', '', ''],
  ['T-05', 'Typography', 'Form field labels visible above inputs', '', ''],
  ['T-06', 'Typography', 'No visible spelling errors on main screens', '', ''],
  // Spacing & Layout
  ['L-01', 'Layout', 'Sidebar visible and not overlapping main content', '', ''],
  ['L-02', 'Layout', 'Cards have consistent padding (~20-24px)', '', ''],
  ['L-03', 'Layout', 'Page header: title and action button aligned properly', '', ''],
  ['L-04', 'Layout', 'Tables have proper column spacing (not cramped)', '', ''],
  ['L-05', 'Layout', 'Form rows have consistent spacing between fields', '', ''],
  ['L-06', 'Layout', 'Footer / bottom content not cut off', '', ''],
  // Hover & Focus
  ['H-01', 'Hover / Focus', 'Buttons: hover changes background color visibly', '', ''],
  ['H-02', 'Hover / Focus', 'Sidebar links: hover shows highlight background', '', ''],
  ['H-03', 'Hover / Focus', 'Table rows: hover shows light highlight', '', ''],
  ['H-04', 'Hover / Focus', 'Input fields: focus shows blue outline border', '', ''],
  ['H-05', 'Hover / Focus', 'Tab key navigates through all form fields in logical order', '', ''],
  ['H-06', 'Hover / Focus', 'Links: cursor changes to pointer on hover', '', ''],
  // Loading & Animations
  ['A-01', 'Loading', 'Loading spinner appears when fetching data', '', ''],
  ['A-02', 'Loading', 'Submit buttons show loading state (disabled + spinner)', '', ''],
  ['A-03', 'Loading', 'Page transitions smooth (no jarring flash)', '', ''],
  ['A-04', 'Loading', 'Modals open with fade animation', '', ''],
  ['A-05', 'Loading', 'Toast notifications appear and auto-dismiss', '', ''],
  ['A-06', 'Loading', 'No white flash on initial page load', '', ''],
  // Empty States
  ['E-01', 'Empty States', 'New account: each module shows "No X yet" message (not blank)', '', ''],
  ['E-02', 'Empty States', 'Empty states have icon + message + call-to-action button', '', ''],
  ['E-03', 'Empty States', 'No blank white boxes or missing content placeholders', '', ''],
  ['E-04', 'Empty States', 'Empty tables do not show broken headers with zero rows', '', ''],
  ['E-05', 'Empty States', 'Dashboard stats show 0 (not blank) when no data exists', '', ''],
  // Error States
  ['ER-01', 'Error States', 'Form validation: red error text below each invalid field', '', ''],
  ['ER-02', 'Error States', 'Required fields clearly marked (asterisk or label)', '', ''],
  ['ER-03', 'Error States', 'API errors show user-friendly toast message (not raw JSON)', '', ''],
  ['ER-04', 'Error States', '404 page shows "Page not found" with back button', '', ''],
  ['ER-05', 'Error States', 'Network timeout: app shows error, does not freeze', '', ''],
], [6, 18, 60, 24, 40]);

// ── SHEET 4 : TEST CASES ─────────────────────────────────────────────────────
const tcHeader = ['Test ID', 'Priority', 'Module', 'Feature', 'Test Steps', 'Expected Result', 'Actual Result', 'Status', 'Tester', 'Date', 'Notes'];

const testCases = [
  // ── AUTH ──
  ['TC-001','P1','Authentication','Register — full flow','1. Go to /register\n2. Fill all fields with valid data\n3. Click "Create Account"','Redirects to "Check your email" page. Verification email arrives in inbox.','','','','',''],
  ['TC-002','P1','Authentication','Email Verification','1. Click verification link in email','Email verified. Redirected to login page with success message.','','','','',''],
  ['TC-003','P1','Authentication','Login — correct credentials','1. Go to /login\n2. Enter verified email + correct password\n3. Click "Sign In"','Redirected to /business-setup (first time) or /dashboard.','','','','',''],
  ['TC-004','P2','Authentication','Login — wrong password','1. Enter a wrong password on login','Error: "Invalid credentials". No login. Page stays on /login.','','','','',''],
  ['TC-005','P2','Authentication','Login — unverified email','1. Register without verifying\n2. Try to login','Error: "Please verify your email before logging in".','','','','',''],
  ['TC-006','P2','Authentication','Forgot Password','1. Click "Forgot password"\n2. Enter email\n3. Click link in inbox\n4. Enter new password','Reset email arrives. New password works. Old password no longer works.','','','','',''],
  ['TC-007','P2','Authentication','Register — validation','1. Submit empty form\n2. Submit invalid email\n3. Submit password < 8 chars','Each invalid field shows a specific error. Form does not submit.','','','','',''],
  ['TC-008','P1','Authentication','Auth guard — unauthenticated access','1. Log out\n2. Paste /dashboard in browser','Redirected to /login. Cannot access dashboard.','','','','',''],
  ['TC-009','P2','Authentication','Logout','1. Click user menu\n2. Click "Sign Out"','Session cleared. Redirected to /login. Back button does not restore session.','','','','',''],
  ['TC-010','P3','Authentication','Login page UI','1. Open /login on desktop and mobile','Logo, form, "Forgot password" link visible. No overflow. Green CTA button.','','','','',''],
  // ── BUSINESS SETUP ──
  ['TC-011','P1','Business Setup','Create first business','1. After first login\n2. Fill business name, phone, address\n3. Click Save','Business created. Redirected to /dashboard. Business name in sidebar.','','','','',''],
  ['TC-012','P2','Business Setup','Validation — empty name','1. Submit business setup with empty name','Error: "Business name is required". Form stays open.','','','','',''],
  ['TC-013','P3','Business Setup','Logo upload','1. Upload a PNG logo','Logo preview shown. Logo appears in header after save.','','','','',''],
  // ── DASHBOARD ──
  ['TC-014','P1','Dashboard','Stat cards load','1. Navigate to /dashboard\n2. Wait for page to load','4 stat cards visible: Revenue, Quotes, Invoices, Active Projects. Values load (0 if no data).','','','','',''],
  ['TC-015','P2','Dashboard','Revenue chart','1. View dashboard after at least 1 paid invoice','Revenue chart renders with correct months. Bars/lines visible.','','','','',''],
  ['TC-016','P2','Dashboard','Quick actions','1. Click each quick action button','Each navigates correctly: New Quote, New Invoice, New Contact, New Project.','','','','',''],
  ['TC-017','P2','Dashboard','Recent activity','1. Create a quote\n2. Return to dashboard','Recent activity shows the newly created quote.','','','','',''],
  ['TC-018','P3','Dashboard','Dashboard UI','1. Check on 1280px screen','No overflow. All elements visible. Navy heading. Correct colors.','','','','',''],
  ['TC-019','P2','Dashboard','Notifications bell','1. Click bell icon in header','Dropdown opens with notification list. Unread badge visible.','','','','',''],
  // ── NAVIGATION ──
  ['TC-020','P1','Navigation','All sidebar links','1. Click every sidebar link','Each link navigates to the correct page without 404 or error.','','','','',''],
  ['TC-021','P2','Navigation','Active state','1. Navigate to each page via sidebar','Active link is highlighted (green or bold). Others are not.','','','','',''],
  ['TC-022','P2','Navigation','Business switcher','1. Click the business name dropdown in sidebar','Shows current business. Multiple businesses listed if applicable.','','','','',''],
  ['TC-023','P2','Navigation','Mobile nav drawer','1. Open app on 390px\n2. Tap hamburger/menu','Drawer opens. All links accessible.','','','','',''],
  ['TC-024','P3','Navigation','Hover states','1. Hover over each sidebar item','Color change on hover. Cursor is pointer.','','','','',''],
  // ── CONTACTS ──
  ['TC-025','P1','Contacts','Create customer contact','1. Contacts → New Contact\n2. Fill name, email, phone, address\n3. Type: Customer\n4. Save','Contact saved. Appears in list. Success toast shown.','','','','',''],
  ['TC-026','P1','Contacts','Create lead','1. New Contact → Type: Lead\n2. Set Status: "New Lead"\n3. Save','Lead appears in Leads tab. Status "New Lead" visible.','','','','',''],
  ['TC-027','P2','Contacts','Edit contact','1. Open a contact\n2. Edit phone number\n3. Save','Updated phone number saved and shown.','','','','',''],
  ['TC-028','P2','Contacts','Delete contact','1. Open a contact\n2. Click Delete\n3. Confirm','Contact removed from list.','','','','',''],
  ['TC-029','P2','Contacts','Search contacts','1. Type a name in search box','List filters in real-time to matching contacts.','','','','',''],
  ['TC-030','P2','Contacts','Lead status update','1. Open a lead\n2. Change status to "In Conversation"\n3. Save','Status badge updated to "In Conversation".','','','','',''],
  ['TC-031','P3','Contacts','Contact tabs','1. Switch between All / Customers / Leads tabs','Each tab shows only the correct type. Counts shown in tabs.','','','','',''],
  ['TC-032','P3','Contacts','Contact detail page','1. Click a contact name','Detail page shows all info, linked quotes, invoices, projects, notes.','','','','',''],
  // ── QUOTES ──
  ['TC-033','P1','Quotes','Create quote','1. Quotes → New Quote\n2. Select contact\n3. Add 2 line items\n4. Apply 10% tax\n5. Save','Quote Q-0001 created. Totals correct. Status: Draft.','','','','',''],
  ['TC-034','P1','Quotes','Quote totals calculation','1. Add items: $100 + $200\n2. Apply 10% tax','Subtotal: $300. Tax: $30. Total: $330. Updates dynamically.','','','','',''],
  ['TC-035','P2','Quotes','Add / remove line items','1. Create quote with 3 items\n2. Delete the middle item','Item removed. Total updates instantly.','','','','',''],
  ['TC-036','P2','Quotes','Send quote','1. Open Draft quote\n2. Click Send\n3. Confirm','Status → Sent. Email sent to contact.','','','','',''],
  ['TC-037','P2','Quotes','Convert quote to invoice','1. Open Sent quote\n2. Click "Convert to Invoice"','New invoice created with same items and contact.','','','','',''],
  ['TC-038','P2','Quotes','Edit quote','1. Open Draft quote\n2. Edit item rate\n3. Save','Changes saved. Updated totals shown.','','','','',''],
  ['TC-039','P2','Quotes','Status badges','1. View quotes list with various statuses','Draft: gray, Sent: blue, Accepted: green, Rejected: red. All correct.','','','','',''],
  ['TC-040','P3','Quotes','Download PDF','1. Open a quote\n2. Click Download PDF / Print','PDF opens with logo, contact info, line items, total.','','','','',''],
  ['TC-041','P2','Quotes','Auto-numbering','1. Create 3 quotes back-to-back','Numbers sequential: Q-0001, Q-0002, Q-0003. No duplicates.','','','','',''],
  ['TC-042','P3','Quotes','Quote notes','1. Add a note to a quote\n2. Save','Notes saved and visible in detail view.','','','','',''],
  // ── INVOICES ──
  ['TC-043','P1','Invoices','Create invoice','1. Invoices → New Invoice\n2. Select contact\n3. Add items, apply tax\n4. Set due date\n5. Save','Invoice INV-0001 created. Status: Draft. Totals correct.','','','','',''],
  ['TC-044','P2','Invoices','Send invoice','1. Open Draft invoice\n2. Click Send\n3. Confirm','Status → Sent. Email with invoice link sent to contact.','','','','',''],
  ['TC-045','P1','Invoices','Mark as paid','1. Open Sent invoice\n2. Click Mark as Paid\n3. Confirm','Status → Paid. Revenue stat on dashboard updates.','','','','',''],
  ['TC-046','P2','Invoices','Overdue invoice','1. Create invoice with past due date','Invoice shows "Overdue" badge in red/orange.','','','','',''],
  ['TC-047','P2','Invoices','Filter by status','1. Apply filters: Draft / Sent / Paid / Overdue','Each filter shows only invoices of that status.','','','','',''],
  ['TC-048','P3','Invoices','Invoice PDF','1. Download or print invoice PDF','PDF shows logo, company, contact, line items, total, due date, number.','','','','',''],
  ['TC-049','P2','Invoices','Auto-create project','1. Create invoice without linking a project','System auto-creates a project and links the invoice to it.','','','','',''],
  ['TC-050','P2','Invoices','Stripe payment link','1. Open Sent invoice\n2. Click "Pay Online"\n3. Use test card 4242 4242 4242 4242','Stripe checkout opens. Payment processes. Invoice marked Paid.','','','','',''],
  // ── PAYMENTS ──
  ['TC-051','P1','Payments','Payments list','1. Navigate to /payments','Table loads. Columns: invoice, contact, amount, date, status.','','','','',''],
  ['TC-052','P2','Payments','Record manual payment','1. Payments → Record Payment\n2. Select invoice, enter amount, date, method\n3. Save','Payment recorded. Invoice status updates to Paid (if full amount).','','','','',''],
  ['TC-053','P2','Payments','Partial payment','1. Record payment for 50% of invoice amount','Invoice shows "Partial" status. Balance due shown correctly.','','','','',''],
  ['TC-054','P2','Payments','Stripe online payment','1. Use pay link from invoice\n2. Use test card 4242 4242 4242 4242','Payment processes. Invoice marked Paid. Stripe dashboard shows charge.','','','','',''],
  ['TC-055','P3','Payments','Payment totals','1. Check payment page summary stats','Total received and outstanding amounts shown accurately.','','','','',''],
  // ── PROJECTS ──
  ['TC-056','P1','Projects','Create project','1. Projects → New Project\n2. Name, client, start/end date\n3. Save','Project PRJ-0001 created. Status: Active. Appears in list.','','','','',''],
  ['TC-057','P2','Projects','Project status changes','1. Change status: Planning → Active → Completed','Badge updates each time. Planning: gray, Active: green, Completed: blue.','','','','',''],
  ['TC-058','P2','Projects','Add tasks','1. Open project\n2. Add 3 tasks with names and due dates','Tasks appear. Can mark complete. Progress bar updates.','','','','',''],
  ['TC-059','P2','Projects','Team members','1. Add a team member to project','Member assigned. Shown in project detail with role.','','','','',''],
  ['TC-060','P2','Projects','Project updates / notes','1. Add a project update','Update saved with timestamp. Appears in updates feed.','','','','',''],
  ['TC-061','P3','Projects','Filter projects','1. Filter by: Active / Completed / On Hold','List filters correctly.','','','','',''],
  ['TC-062','P3','Projects','Budget tracking','1. Set budget\n2. Link an invoice','Budget vs actual spend tracked. Indicator shown (green/orange/red).','','','','',''],
  // ── CHANGE ORDERS ──
  ['TC-063','P1','Change Orders','Create change order','1. Change Orders → New\n2. Link to project\n3. Add description and amount\n4. Save','Change order saved as Draft. Linked to project.','','','','',''],
  ['TC-064','P2','Change Orders','Send for approval','1. Open Draft change order\n2. Click "Send for Approval"','Status → Sent. Client notified.','','','','',''],
  ['TC-065','P2','Change Orders','Approve / Reject','1. Mark one as Approved\n2. Mark another as Rejected','Approved: green badge. Rejected: red badge. Budget updated on approval.','','','','',''],
  ['TC-066','P3','Change Orders','Change orders list','1. View all change orders','Table shows: number, project, description, amount, status, date.','','','','',''],
  // ── SCHEDULING ──
  ['TC-067','P2','Scheduling','Set availability','1. Scheduling → Availability tab\n2. Set Mon–Fri 9am–5pm\n3. Save','Availability saved. Time slots reflect set hours.','','','','',''],
  ['TC-068','P2','Scheduling','Create booking link','1. Scheduling → Links tab\n2. Create link for "30-minute consultation"','Booking link generated. Shareable URL shown.','','','','',''],
  ['TC-069','P2','Scheduling','Meetings list','1. Scheduling → Meetings tab','Shows scheduled meetings: client name, time, type.','','','','',''],
  ['TC-070','P2','Scheduling','Meeting types','1. Scheduling → Settings\n2. Create 60-minute meeting type','Meeting type saved. Appears in booking link options.','','','','',''],
  // ── COMMUNICATIONS ──
  ['TC-071','P2','Communications','Send email log','1. Communications → New\n2. Channel: Email\n3. Select contact, write subject + body\n4. Send','Email sent (or console-logged). Appears in communication log.','','','','',''],
  ['TC-072','P2','Communications','Log a call','1. New → Channel: Call\n2. Select contact, add notes, duration\n3. Save','Call logged with timestamp.','','','','',''],
  ['TC-073','P2','Communications','Add note','1. New → Channel: Note\n2. Write note\n3. Save','Note saved. Visible in contact history.','','','','',''],
  ['TC-074','P2','Communications','SMS / WhatsApp log','1. Log SMS and WhatsApp communication types','Saved with correct channel type. Icons distinguish them.','','','','',''],
  ['TC-075','P3','Communications','Filter by channel','1. Filter by: Email / SMS / Call / Note','List filters to show only selected channel.','','','','',''],
  // ── TEAM ──
  ['TC-076','P2','Team','Invite team member','1. Team → Invite Member\n2. Enter email, role: Staff\n3. Send','Invite email sent. Pending invite shows in team list with "Pending" badge.','','','','',''],
  ['TC-077','P2','Team','Accept invite','1. Check invited email\n2. Click invite link\n3. Register or login','Invited user joined. Active in team list with correct role.','','','','',''],
  ['TC-078','P2','Team','Change role','1. Change member from Staff to Admin','Role updated. Member sees more permissions on next login.','','','','',''],
  ['TC-079','P1','Team','Remove member','1. Remove a team member\n2. Try to login as that member','Member removed. Session invalidated. Cannot access business data.','','','','',''],
  ['TC-080','P2','Team','Role permissions','1. Login as Staff\n2. Try to access Team settings','Staff cannot manage team. Owner-only actions hidden or blocked.','','','','',''],
  // ── TEMPLATES ──
  ['TC-081','P2','Templates','Create template','1. Templates → New Template\n2. Select type, add items\n3. Save','Template saved. Appears in template list.','','','','',''],
  ['TC-082','P2','Templates','Use template in quote','1. New quote → "Use Template"\n2. Select the saved template','Line items pre-filled. Can edit before saving.','','','','',''],
  ['TC-083','P3','Templates','Edit template','1. Edit a template\n2. Save','Updated template saved. Future uses reflect the change.','','','','',''],
  ['TC-084','P3','Templates','Delete template','1. Delete a template','Confirmation dialog shown. Template removed from list after confirm.','','','','',''],
  // ── NOTIFICATIONS ──
  ['TC-085','P2','Notifications','Bell notifications','1. Send a quote\n2. Check notification bell','Notification in dropdown. Unread count badge shown.','','','','',''],
  ['TC-086','P2','Notifications','Mark as read','1. Click a notification in dropdown','Marked as read. Count badge decreases. Unread dot removed.','','','','',''],
  ['TC-087','P3','Notifications','Notification settings','1. Settings → Notifications\n2. Toggle off "Quote Sent"\n3. Send a quote','No notification received for that action (setting honored).','','','','',''],
  // ── SETTINGS ──
  ['TC-088','P2','Settings','Update profile name','1. Settings → Profile\n2. Change name\n3. Save','Name updated. Shown in sidebar and header immediately.','','','','',''],
  ['TC-089','P2','Settings','Change password','1. Settings → Security\n2. Enter current + new password\n3. Save','Password changed. Old password no longer works.','','','','',''],
  ['TC-090','P2','Settings','Quote prefix','1. Settings → Numbering\n2. Change quote prefix to "EST-"\n3. Save\n4. Create new quote','New quote uses EST-0001. Previous quotes unchanged.','','','','',''],
  ['TC-091','P2','Settings','Default tax rate','1. Settings → Preferences\n2. Set tax to 8.5%\n3. Create new quote','Quote pre-fills tax at 8.5%.','','','','',''],
  ['TC-092','P3','Settings','Email reply-to','1. Settings → Email\n2. Set reply-to address\n3. Save','Saved. Used in sent emails.','','','','',''],
  ['TC-093','P3','Settings','Currency / region','1. Settings → Region\n2. Set currency to USD\n3. Check a quote','$ symbol shown on quotes and invoices.','','','','',''],
  ['TC-094','P3','Settings','All 9 tabs load','1. Click through all 9 Settings tabs','All tabs load without error: Profile, Preferences, Numbering, Notifications, Email, Integrations, Region, Security, API/Webhooks.','','','','',''],
  // ── SUBSCRIPTION ──
  ['TC-095','P2','Subscription','Subscription page UI','1. Navigate to /subscription','3 plans shown: Free Trial ($0/15d), Monthly ($49/mo), Yearly ($490/yr).','','','','',''],
  ['TC-096','P2','Subscription','Upgrade to Monthly','1. Click "Upgrade" on Monthly\n2. Complete Stripe checkout with test card','Checkout opens. Payment processed. Plan upgraded to Monthly.','','','','',''],
  ['TC-097','P3','Subscription','Trial countdown','1. Check trial countdown on subscription page','Days remaining shown accurately. Upgrade CTA visible.','','','','',''],
  ['TC-098','P3','Subscription','Billing history','1. After upgrading, check billing history','Past payments shown with date, amount, status.','','','','',''],
  // ── AI CHATBOT ──
  ['TC-099','P2','AI Chatbot','Open chatbot','1. Find AI assistant icon\n2. Click to open','Chat panel opens. Greeting message shown.','','','','',''],
  ['TC-100','P2','AI Chatbot','Ask a question','1. Type: "How do I create a quote?"\n2. Press Enter','Relevant answer within 5 seconds.','','','','',''],
  ['TC-101','P3','AI Chatbot','Multi-turn conversation','1. Ask 3 follow-up questions','Each response coherent and references previous context.','','','','',''],
  ['TC-102','P3','AI Chatbot','Chat UI check','1. Check bubble colors, input, send button','User messages: right-aligned blue/navy. AI: left-aligned gray. Input and send button visible.','','','','',''],
  // ── REPORTS ──
  ['TC-103','P2','Reports','Reports page loads','1. Navigate to /reports','Charts and summary stats load.','','','','',''],
  ['TC-104','P2','Reports','Date range filter','1. Set range to "Last 30 days"','Charts and stats update to reflect only that range.','','','','',''],
  ['TC-105','P3','Reports','Revenue accuracy','1. View with 2+ paid invoices','Revenue total matches sum of paid invoices. Chart correct.','','','','',''],
  // ── SECURITY ──
  ['TC-106','P1','Security','Data isolation (multi-tenant)','1. Register Account A and Account B\n2. Create quote as Account A\n3. Login as Account B\n4. Check /quotes','Account B sees ZERO data from Account A. No cross-tenant leakage.','','','','',''],
  ['TC-107','P1','Security','API auth without cookie','1. Open DevTools → Network\n2. Call /api/quotes without session cookie','API returns 401 Unauthorized. No data returned.','','','','',''],
  ['TC-108','P1','Security','HTTPS enforced','1. Check URL bar on clearbuildusa.com','Padlock shown. URL starts https://. No "Not Secure" warning.','','','','',''],
  ['TC-109','P2','Security','Session cookie flags','1. DevTools → Application → Cookies\n2. Inspect cb_session cookie','HttpOnly: yes. SameSite: Lax or Strict. Secure flag: yes.','','','','',''],
  ['TC-110','P2','Security','XSS test','1. Enter <script>alert(1)</script> in a text field\n2. Save and reload','Script NOT executed. Text shown literally or escaped. No alert popup.','','','','',''],
];

// add header row
const tcRows = [tcHeader, ...testCases];
addSheet('Test Cases', tcRows, [8, 6, 16, 18, 48, 40, 30, 10, 12, 10, 25]);

// ── SHEET 5 : BUG REPORTS ────────────────────────────────────────────────────
addSheet('Bug Reports', [
  ['Clear Build USA — Bug Reports'],
  ['Fill one row per bug. Number sequentially: BUG-001, BUG-002, etc.'],
  [],
  [
    'Bug ID', 'Date Found', 'Tester Name',
    'Module', 'Test Case ID', 'Priority (P1/P2/P3/P4)',
    'Browser + Version', 'Device / OS', 'Screen Size (px)',
    'URL When Found',
    'Bug Title (Short Description)',
    'Steps to Reproduce',
    'Expected Result', 'Actual Result',
    'Screenshot Filename(s)',
    'Frequency (always/sometimes/once)',
    'Additional Notes',
    'Status (Open/Fixed/Wont Fix)',
    'Fixed in Version',
  ],
  // 10 blank rows
  ['BUG-001','','','','','','','','','','','','','','','','','',''],
  ['BUG-002','','','','','','','','','','','','','','','','','',''],
  ['BUG-003','','','','','','','','','','','','','','','','','',''],
  ['BUG-004','','','','','','','','','','','','','','','','','',''],
  ['BUG-005','','','','','','','','','','','','','','','','','',''],
  ['BUG-006','','','','','','','','','','','','','','','','','',''],
  ['BUG-007','','','','','','','','','','','','','','','','','',''],
  ['BUG-008','','','','','','','','','','','','','','','','','',''],
  ['BUG-009','','','','','','','','','','','','','','','','','',''],
  ['BUG-010','','','','','','','','','','','','','','','','','',''],
], [9, 12, 16, 16, 10, 10, 18, 16, 12, 32, 35, 48, 35, 35, 22, 12, 35, 16, 14]);

// ── SHEET 6 : DAILY REPORT ───────────────────────────────────────────────────
addSheet('Daily Report', [
  ['Clear Build USA — Daily Testing Report'],
  ['Fill one row at the end of each testing day.'],
  [],
  [
    'Date', 'Tester Name', 'Session (e.g. 9am-5pm)',
    'Tests Executed', 'Passed', 'Failed', 'Skipped / N/A',
    'Pass Rate (%)',
    'Modules Tested (list)',
    'Bugs Found (BUG IDs)',
    'P1 Bugs Today', 'P2 Bugs Today',
    'Blockers / Issues Faced',
    'Plan for Tomorrow',
    'Notes',
  ],
  ['','','','','','','','=IF(D5>0,ROUND(E5/D5*100,1)&"%","—")','','','','','','',''],
  ['','','','','','','','=IF(D6>0,ROUND(E6/D6*100,1)&"%","—")','','','','','','',''],
  ['','','','','','','','=IF(D7>0,ROUND(E7/D7*100,1)&"%","—")','','','','','','',''],
  ['','','','','','','','=IF(D8>0,ROUND(E8/D8*100,1)&"%","—")','','','','','','',''],
  ['','','','','','','','=IF(D9>0,ROUND(E9/D9*100,1)&"%","—")','','','','','','',''],
], [12, 16, 16, 14, 10, 10, 14, 12, 35, 30, 12, 12, 40, 40, 30]);

// ── SHEET 7 : FINAL SUMMARY ──────────────────────────────────────────────────
addSheet('Final Summary', [
  ['Clear Build USA — Final QA Testing Summary'],
  [],
  ['Testing Start Date', ''],
  ['Testing End Date', ''],
  ['Tester Name(s)', ''],
  ['Test Environment', 'https://clearbuildusa.com'],
  [],
  ['OVERALL RESULTS'],
  ['Metric', 'Count', 'Percentage'],
  ['Total Test Cases', 220, '100%'],
  ['Passed', '', ''],
  ['Failed', '', ''],
  ['Skipped / N/A', '', ''],
  ['Total Bugs Reported', '', ''],
  ['P1 Critical Bugs', '', ''],
  ['P2 High Bugs', '', ''],
  ['P3 Medium Bugs', '', ''],
  ['P4 Low Bugs', '', ''],
  [],
  ['MODULE-BY-MODULE SUMMARY'],
  ['Module', '# Tests', 'Passed', 'Failed', 'Bugs', 'Result (PASS/FAIL/PARTIAL)'],
  ['Authentication', 10, '', '', '', ''],
  ['Business Setup', 3, '', '', '', ''],
  ['Dashboard', 6, '', '', '', ''],
  ['Navigation', 5, '', '', '', ''],
  ['Contacts / Leads', 8, '', '', '', ''],
  ['Quotes', 10, '', '', '', ''],
  ['Invoices', 8, '', '', '', ''],
  ['Payments', 5, '', '', '', ''],
  ['Projects', 7, '', '', '', ''],
  ['Change Orders', 4, '', '', '', ''],
  ['Scheduling', 4, '', '', '', ''],
  ['Communications', 5, '', '', '', ''],
  ['Team Management', 5, '', '', '', ''],
  ['Templates', 4, '', '', '', ''],
  ['Notifications', 3, '', '', '', ''],
  ['Settings', 7, '', '', '', ''],
  ['Subscription', 4, '', '', '', ''],
  ['AI Chatbot', 4, '', '', '', ''],
  ['Reports', 3, '', '', '', ''],
  ['Security Checks', 5, '', '', '', ''],
  ['UI/UX Checklist', 35, '', '', '', ''],
  ['Browser / Device Compat', 30, '', '', '', ''],
  ['TOTAL', 220, '', '', '', ''],
  [],
  ['CRITICAL ISSUES — P1 & P2 (Must fix before launch)'],
  ['Bug ID', 'Module', 'Title', 'Priority', 'Recommended Action', 'Fixed? (Y/N)'],
  ['BUG-', '', '', '', '', ''],
  ['BUG-', '', '', '', '', ''],
  ['BUG-', '', '', '', '', ''],
  ['BUG-', '', '', '', '', ''],
  ['BUG-', '', '', '', '', ''],
  [],
  ['LAUNCH DECISION'],
  ['Overall Assessment', ''],
  ['  Options:', '✅ READY TO LAUNCH — All P1/P2 fixed, P3/P4 accepted'],
  ['', '⚠️  READY WITH CONDITIONS — Fix the critical bugs listed above first'],
  ['', '❌ NOT READY — Multiple P1 blockers need resolution'],
  ['Selected:', ''],
  [],
  ['Tester Sign-off Notes', ''],
  ['Date of Sign-off', ''],
], [28, 18, 12, 12, 12, 30]);

// ── WRITE FILE ────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '04-QA-Testing-Process.xlsx');
XLSX.writeFile(wb, outPath);
console.log('✓ Saved: 04-QA-Testing-Process.xlsx');
console.log('  Location: ' + outPath);
