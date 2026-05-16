# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server on port 3000
npm run build      # production build (run this to catch TypeScript/compile errors)
npm run lint       # ESLint
npm run start      # start production server
```

There are no tests. Use `npm run build` as the primary correctness check before committing.

## Architecture

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Supabase (PostgreSQL) · Tailwind CSS · Deployed on Vercel

### Authentication & Session

Auth is entirely custom — no NextAuth or Supabase Auth. The flow:

1. `lib/session.ts` — JWT signed with `jose`. Cookie name: `cb_session`. Payload: `{ id, name, email, businessId, role }`.
2. `lib/auth.ts` — `requireSession()` reads the cookie server-side (used in API routes). `getSession()` is the non-throwing variant.
3. `middleware.ts` — guards all `/dashboard`, `/contacts`, etc. routes. Redirects unauthenticated users to `/login`, and authenticated users without a `businessId` to `/business-setup`.
4. Passwords hashed with `bcryptjs`. Email verification required before login.

### Multi-Business Model

A user can belong to multiple businesses via the `business_members` table (`user_id`, `business_id`, `role`). The active business is stored in the JWT (`businessId`). Switching businesses (`/api/businesses/switch`) re-signs the JWT with the new `businessId` and updates `users.last_business_id`. **Every API route filters data by `session.businessId`** — this is the multi-tenancy boundary.

### API Route Pattern

All API routes follow this identical pattern:

```ts
const session = await requireSession().catch(() => null);
if (!session?.businessId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
// then query supabase filtering by session.businessId
```

The Supabase client in `lib/supabase.ts` uses the **service role key** (bypasses RLS). Row-level access control is enforced in application code by always filtering `eq("business_id", session.businessId)`.

### Auto-numbering

Quotes, invoices, and projects get sequential numbers on creation. Each business stores prefixes (`quote_prefix`, `invoice_prefix`, `project_prefix`) in the `businesses` table. The API counts existing records and pads to 4 digits: `Q-0001`, `INV-0001`, `PRJ-0001`.

### Invoice → Project auto-creation

When creating an invoice without selecting a project, `POST /api/invoices` automatically creates a project and links the invoice to it.

### Client Pages vs API

All pages under `app/(app)/` are `"use client"` components that fetch from their corresponding `app/api/` routes. The `app/(app)/layout.tsx` is a **server component** that reads the session and passes `user`, `businesses`, and `currentBusiness` to the `<Sidebar>`.

### Design System

Defined in `app/globals.css` (Tailwind `@layer components`) and `tailwind.config.js`. Key classes:

- `.btn`, `.btn-primary`, `.btn-green`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.btn-sm`
- `.field` — all form inputs
- `.label` — all form labels
- `.card` — white bordered container
- `.badge` — status pill
- `.table-wrapper`, `.table-base` — all data tables
- `.page-header`, `.page-title`, `.section-title`
- `.form-section`, `.form-row`, `.form-row-3`

Brand colors: Navy `#123B5D` (`brand-navy`), Green `#3FA66B` (`brand-green`). Background `#F5F7FA`. Border `#E5E7EB`. Text `#1F2937` / `#6B7280`.

Shared UI components (`Modal`, `ConfirmDialog`, `EmptyState`, `Spinner`, `StatusBadge`, `Toast`, `StatCard`, `Tabs`, `FormField`) live in `components/ui.tsx`.

### Email

`lib/email.ts` uses **Resend** (`RESEND_API_KEY`). If the key is missing, emails are mocked to the console — so the app works locally without Resend configured. Email templates: `verificationEmail`, `passwordResetEmail`, `teamInviteEmail`.

### Team Invitations

`POST /api/team` creates a `team_invitations` row and emails an invite link with a token. The invite link points to `/invite?token=...`. If the invitee already has an account, they log in and the business appears in their switcher; otherwise they register first.

## Environment Variables

Required in `.env` (see `.env.example` for the key names):

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS) |
| `JWT_SECRET` | Signs session JWTs |
| `RESEND_API_KEY` | Email sending (optional locally) |
| `NEXT_PUBLIC_APP_URL` | Used for invite/verification links |

## Key Database Tables

`users`, `businesses`, `business_members` (join), `subscriptions`, `contacts`, `quotes`, `quote_items`, `invoices`, `invoice_items`, `projects`, `payments`, `communications` / `communication_logs`, `notifications`, `team_invitations`, `feedback`, `project_updates`, `item_requirements`.

The `contacts` table uses `contact_type` (`lead` | `customer` | `direct_contact`) and `lead_status` (free-text status like "New Lead", "In Conversation", etc.).
