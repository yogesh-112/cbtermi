# Clear Build USA — Complete Application Flow

> Living document. Updated 2026-06-12 after the full manual test pass.
> Stack: Next.js 15 · React 19 · Supabase · Stripe · Resend · Gemini chatbot.
> Deployed: GitHub `yogesh-112/cbtermi` → Hostinger → https://clearbuildusa.com

---

## 1. Public / Marketing

| Page | Purpose |
|---|---|
| `/` | Landing page (EN/ES/PT switcher, responsive). CTA → `/register` |
| `/login` · `/register` · `/forgot-password` · `/reset-password` · `/verify-email` | Auth flows |
| `/invite?token=…` | Team invite acceptance |
| `/quotes/[id]/preview` | **Public** customer quote approval (e-sign, approve/reject) |
| `/change-orders/[id]/preview` | **Public** change-order approval |
| `/invoices/[id]/pay` | **Public** Stripe invoice payment |
| `/booking/[token]` | **Public** meeting booking from a shared link |
| `/feedback/respond/[token]` | **Public** customer feedback response |

## 2. Onboarding flow

```
Register (name/email/password ≥8 chars)
  → verification email (Resend)
  → Verify email → Login
  → /business-setup (create first business: name optional, prefixes, tax)
  → Dashboard. Trial starts: 14 days (businesses.trial_ends_at + subscriptions row)
```

- A user can own/belong to **multiple businesses** (`business_members`), switched
  from the topbar (desktop) or header (mobile). Switching re-signs the JWT.
- Roles per business: **owner / admin / staff / crew**. Audit Log and payment
  recording and notification sending are owner/admin only.

## 3. Trial & Billing flow

```
Trial (14 days, full access)
  → Sidebar badge counts down from subscriptions.trial_ends_at
  → Expired: creates/sends are blocked (403 from checkTrialAccess), viewing still works
  → /subscription → choose Monthly $49 / Yearly $490 (+ optional coupon)
  → Stripe Checkout → redirect back with session_id
  → /api/billing/sync pulls plan/status/period from Stripe (webhook not required)
  → Sidebar shows "Pro plan · Renews <date>" ; gates lift immediately
Stripe portal (manage card, cancel) → /api/billing/portal
```

## 4. Sales pipeline (core CRM flow)

```
LEAD → (optional) OPPORTUNITY → QUOTE → approval → PROJECT → INVOICE → PAYMENT
```

1. **Contacts** (`/contacts`, `/leads`, `/customers`) — one table, `contact_type`
   = lead | customer | direct_contact. "New Contact / Add Lead" buttons open the
   create modal (also via `/contacts?new=1`). Leads can be **converted** to
   customers in one click.
2. **Opportunities** (`/opportunities`) — pipeline stage between lead and quote
   (status, estimated value, linked contact).
3. **Quotes** (`/quotes`, `/quotes/new`) — line items (qty × rate − discount
   + tax), sections, draft → send. Sending emails the customer a public
   approval link. Customer approves/rejects (writes an `approvals` record +
   quote version snapshot). Statuses: draft, sent, viewed, approved, rejected.
4. **Projects** (`/projects`) — created manually or **auto-created when an
   invoice is saved without a project**. Tasks, team assignment, budget,
   updates, item requirements, change orders all hang off a project.
5. **Change orders** (`/change-orders`) — scoped to project/quote, own line
   items, public approval page like quotes.
6. **Invoices** (`/invoices`, `/invoices/new`) — line items, due dates,
   Save as Draft / Save and Review / Save and Send (send = email + public pay
   link). Stripe checkout marks paid/partially_paid via webhook + idempotent.
7. **Payments** (`/payments`) — record manual payments (cash/check/transfer)
   against invoices (owner/admin only); reversal supported. Stripe payments
   land automatically.

## 5. Operations

| Page | Flow |
|---|---|
| `/scheduling` | Create availability slots → share booking links → customer books → meeting list (scheduled/completed) |
| `/expenses` | Track job costs by category/project; category breakdown totals |
| `/item-requirements` | Material/item lists per project |
| `/project-updates` | Post customer-visible updates (emails the contact) |
| `/communications` | Send + log Email/SMS/WhatsApp per contact |
| `/notifications` | Manual sends from templates + **automation rules** (quote sent/approved, invoice overdue/due-soon, payment received, new lead). Time-based rules run via `/api/cron/notifications` (needs a daily cron on Hostinger!) |
| `/templates` | Reusable system + custom templates (duplicate, edit) |
| `/feedback` | Request/record customer feedback; public respond link |
| `/team` | Invite by email with role; member appears after accepting invite |
| `/audit-log` | Owner/admin only — who did what, filterable |
| `/settings` | Business profile, tax defaults, prefixes, notification prefs, Calendly link, webhooks |
| `/help` | FAQs, common issues, video tutorials, support tickets (tickets work even with expired trial) |
| Chatbot (floating) | Gemini-powered in-app assistant, page-aware, can deep-link |

## 6. Super Admin (separate auth: `cb_admin_session` cookie)

`/admin/login` → dashboard, businesses (activate/suspend), users, subscriptions,
plans, coupons, tutorials, broadcasts, support, audit, impersonation
(banner shows while impersonating; exit returns to admin).

## 7. Mobile vs Desktop parity

Both render the **same pages from the same routes** — parity is by design:

- **Desktop**: fixed sidebar (all modules) + topbar (search, business switcher, CTA).
- **Mobile**: top header (logo, business switcher, avatar) + bottom tab bar
  (Dashboard, Contacts, Quotes, Invoices, **More**). The **More page lists every
  remaining module** — Leads, Customers, Opportunities, Projects, Payments,
  Project Updates, Scheduling, Expenses, Templates, Change Orders,
  Item Requirements, Communications, Feedback, Notifications, Help, Team,
  Subscription, Audit Log (owner/admin), Settings.
- List pages render tables on desktop and card lists on mobile; forms are
  single-column on mobile. Verified by automated pass on 390×844: every page
  renders real content, zero crashes.

## 8. Data & security model (summary)

- All data scoped by `business_id` from the JWT — enforced in every API route.
- Middleware: default-deny for pages; explicit public paths; static files skipped.
- Trial gate (`checkTrialAccess`) on every create/send route; support tickets
  and business creation deliberately exempt.
- Rate limiting on login/register/forgot/reset. Passwords bcrypt, min 8 chars.
- `force_logout_at` invalidates sessions on password change/reset/team removal.

## 9. Testing

- **E2E (Playwright)**: `tests/` specs + `playwright.config.ts`; needs
  `.env.test` (TEST_EMAIL/TEST_PASSWORD of a verified account). Run `npm test`.
- **Full manual-style pass**: `node scripts/manual-test.mjs` (desktop + mobile
  crawl, flows, cleanup) and `node scripts/crawl-errors.mjs` (every page,
  console/page errors). Both need the production build running locally
  (`npm run build && npx next start -p 3000`).
- No unit-test framework is configured; correctness gate is `npm run build`
  plus the scripts above.
