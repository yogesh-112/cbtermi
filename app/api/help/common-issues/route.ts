import { NextResponse } from "next/server";

const COMMON_ISSUES = [
  {
    id: "verification-email",
    title: "Verification email not received",
    reason: "Email may have gone to spam, or the email address may have been entered incorrectly.",
    steps: [
      "Check your spam or junk folder.",
      "Make sure you signed up with the correct email address.",
      "Wait up to 5 minutes — emails may be delayed.",
      "Go to the login page and click 'Resend verification email'.",
      "If the issue persists, submit a support ticket.",
    ],
    action: { label: "Go to Login", href: "/login" },
  },
  {
    id: "cannot-login",
    title: "Cannot log in",
    reason: "Incorrect password, unverified email, or account may be restricted.",
    steps: [
      "Double-check your email and password.",
      "Make sure you have verified your email address.",
      "Use 'Forgot Password' to reset your password.",
      "Clear your browser cache and try again.",
      "If you still cannot log in, submit a support ticket.",
    ],
    action: { label: "Reset Password", href: "/forgot-password" },
  },
  {
    id: "business-switch",
    title: "Business data not showing after switching",
    reason: "Data is isolated per business. After switching, the page needs to reload.",
    steps: [
      "After switching businesses using the switcher in the top bar, the app reloads automatically.",
      "If data is still missing, refresh the page manually.",
      "Confirm you switched to the correct business.",
      "Each business has completely separate contacts, projects, invoices, and team data.",
    ],
    action: null,
  },
  {
    id: "invoice-email",
    title: "Invoice email not sent",
    reason: "Email sending may fail if the contact has no email, or if the email service is not configured.",
    steps: [
      "Check that the contact has a valid email address.",
      "Open the contact and verify the email field is filled in.",
      "Resend the invoice from the invoice detail page.",
      "If you are on a local/test environment, emails are mocked to the console.",
      "Check that RESEND_API_KEY is properly configured in your environment.",
    ],
    action: { label: "View Contacts", href: "/contacts" },
  },
  {
    id: "quote-approval-link",
    title: "Quote approval link not opening",
    reason: "The quote must be in 'Sent' status. Draft quotes do not have active review links.",
    steps: [
      "Make sure the quote was sent (not left as Draft).",
      "Open the quote and click 'Send' to generate and email the approval link.",
      "Links are permanent and tied to the quote ID.",
      "Ask the customer to clear their browser cache if the page doesn't load.",
    ],
    action: { label: "View Quotes", href: "/quotes" },
  },
  {
    id: "whatsapp-sms",
    title: "WhatsApp or SMS draft not opening",
    reason: "WhatsApp and SMS open in your phone's native app. This requires the app to be installed.",
    steps: [
      "Make sure WhatsApp is installed on your device.",
      "For SMS, your phone's default messaging app will open.",
      "On desktop, WhatsApp Web must be open in your browser.",
      "Check that the contact has a phone/WhatsApp number entered.",
      "Try copying the message and sending manually.",
    ],
    action: null,
  },
  {
    id: "payment-balance",
    title: "Payment not updating invoice balance",
    reason: "The invoice balance may not refresh automatically after recording a payment.",
    steps: [
      "Refresh the invoice page after recording a payment.",
      "Make sure the payment was linked to the correct invoice.",
      "Check that the payment amount was entered correctly.",
      "The balance due = Total invoice amount minus all linked payments.",
    ],
    action: { label: "View Payments", href: "/payments" },
  },
  {
    id: "subscription-expired",
    title: "Subscription expired or trial ended",
    reason: "Your free trial has ended or your subscription was cancelled or not renewed.",
    steps: [
      "Go to the Subscription page.",
      "You can still log in and view existing data.",
      "To create or edit records, upgrade to a paid plan.",
      "Select Monthly ($49/month) or Yearly ($490/year).",
      "You will be redirected to Stripe checkout to complete payment.",
    ],
    action: { label: "View Subscription", href: "/subscription" },
  },
  {
    id: "file-upload",
    title: "File upload failed",
    reason: "File may be too large, or the upload service may be temporarily unavailable.",
    steps: [
      "Make sure the file is under 10 MB.",
      "Supported file types: PDF, PNG, JPG, DOCX.",
      "Try uploading again — temporary network issues may cause failures.",
      "Check your internet connection.",
      "If the issue persists, submit a support ticket.",
    ],
    action: null,
  },
];

export async function GET() {
  return NextResponse.json({ issues: COMMON_ISSUES });
}
