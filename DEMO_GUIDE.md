# Yaglob ERP — Senior Management Demo Guide

**Mode:** Browser demo with fictional `yaglob.demo.*` data (isolated from production databases)

### Demo-only security notice (read before sharing a URL)

- **Authentication**, **RBAC**, and **session state** are implemented entirely in the browser with **localStorage**.
- Password verification uses **PBKDF2-SHA-256 in the client**. This is **not** production-grade security.
- Anyone with the demo URL can inspect storage, bypass client checks, or alter demo data locally.
- Treat any public or Vercel preview as a **non-production demonstration**. Prefer Vercel Deployment Protection.
- WhatsApp / email delivery remains **NotConfigured** unless connectors are added later — do not claim live delivery.
- No Neon / Supabase / server ACL is required or assumed for this demo build.

---

## 1. Startup

```bash
cd d:\crm
npm ci
npm run dev
```

Open the URL Vite prints (typically `http://localhost:3000` or `http://localhost:5173`).

You will land on the **login** page. Use the temporary demo administrator (do **not** put the password on slides or the login UI):

| Field    | Value              |
| -------- | ------------------ |
| Email    | `admin@yaglob.com` |
| Password | `Test@123`         |
| Role     | Super Admin        |

### Environment requirements

- Node.js **22.x** and **npm** (lockfile is `package-lock.json`)
- Modern Chromium/Edge/Firefox
- Pop-ups enabled for PDF print windows
- No Meta/Resend credentials required for the demo (delivery stays **NotConfigured**)
- No `.env` values are required for the current demo deployment

---

## 2. Reset demo data (before the meeting)

1. Sign in as Super Admin
2. Open **Invoices** → **Invoice Settings** (or **Settings**)
3. Click **Reset demo data**
4. Refresh the browser (F5)

This clears `yaglob.demo.*` and invoice snapshot keys in `localStorage`, then reseeds interconnected fixtures. It does **not** touch production databases or Lovable schema.

**Preserved on reset:** `yaglob.auth.users.v1`, `yaglob.auth.session.v1`, and `yaglob.dev.registry.v1` (users, roles/permissions, and Development Status). **Logout** clears only the active session key.

---

## 3. 10–15 minute presentation script

| Min   | Talk track                  | Click path                                     | Expected result                                                                          |
| ----- | --------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 0–1   | Sign in + welcome dashboard | Login → `/`                                    | Super Admin lands on Dashboard; KPIs from shared store                                   |
| 1–3   | Lead → customer             | Leads → Convert                                | Customer appears in Customers; lead status Converted                                     |
| 3–5   | Catalog                     | Products                                       | Shared SKUs with HSN, GST, stock                                                         |
| 5–8   | Quote → invoice             | Quotations → Accepted → Convert → Save & Issue | One-time convert; PDF success dialog; delivery chips **NotConfigured**                   |
| 8–10  | Templates / print           | Choose Template / Download / Print             | Same invoice totals; alternate A4/A5/thermal layouts                                     |
| 10–12 | Collections                 | Record partial payment → history → receipt     | Balance updates; Paid when full; receipt download/print does not create a second payment |
| 12–14 | Ops + reports               | Inventory receive; Reports CSV                 | Stock movement idempotent; CSV exports                                                   |
| 14–15 | Close                       | Dashboard refresh                              | Metrics match ledger; mention Phase B for live WhatsApp/email                            |

---

## 4. Completed modules

- Demo authentication (login/logout/session) + PBKDF2 password verification
- Admin Access: users, roles, configurable permissions (deny-by-default)
- Role-aware sidebar, route guards, dashboard widgets, and action gating
- Development Status registry (Super Admin) with progress metrics
- CRM: Dashboard, Leads, Customers, Deals
- Products & Services catalog
- Quotations + convert-once to invoice
- Invoice template engine (8 templates: A4/A5/80mm/58mm)
- Draft / Issue, PDF preview/download/print
- Payments + history + receipt PDF
- Inventory / vendors / PO / GRN
- Reports + CSV (permission-filtered summaries)
- Local demo store + reset (auth/dev keys preserved)

---

## 5. Manual browser testing checklist (pending manual execution)

Automated browser E2E is **unavailable** in this environment. Treat the following as **manual pending** before the demo:

### Auth & access

- [ ] Unauthenticated visit to `/` redirects to `/login`
- [ ] Login with `admin@yaglob.com` / `Test@123`; wrong password rejected
- [ ] Login page does **not** display the default password
- [ ] Sidebar shows only authorized modules; direct URL to denied module → Access restricted
- [ ] Settings → Admin Access: create user with email + temporary password + role
- [ ] New user sees only their modules; dashboard widgets and create/delete/import/export/issue/pay/receive/print respect permissions
- [ ] Cannot deactivate/delete the last Super Admin
- [ ] Settings → Development Status visible only to Super Admin; statuses editable
- [ ] Logout returns to login; users still exist after logout
- [ ] Reset demo data preserves users/roles/dev registry

### Navigation & settings

- [ ] App loads; every authorized sidebar link opens the correct module
- [ ] Invoice Settings saves company/template prefs
- [ ] Reset demo data + hard refresh restores business seed

### CRM

- [ ] Lead create/edit/delete persists after refresh
- [ ] Lead KPI cards reflect live counts
- [ ] Lead → customer convert; second convert does not duplicate customer
- [ ] Customer create/edit with WhatsApp + GSTIN; detail shows invoice/quote/payment history and computed outstanding
- [ ] Deal create/edit/stage change; Won/Lost visible on board; KPI rings live

### Catalog & sales

- [ ] Product create with category, sell/buy price, GST, stock, low-stock
- [ ] Quotation multi-line + Expired/Accepted statuses; PDF preview/download
- [ ] Accepted quote convert once; cancel without save does not convert
- [ ] Invoice product picker auto-fills price/tax; draft does **not** reduce stock
- [ ] Issue invoice reduces tracked goods once; services unchanged; oversell blocked
- [ ] Partial + full payment + overpay rejected; receipt download/print (no second payment)

### Purchase & inventory

- [ ] Vendor create/edit persists
- [ ] Real PO form (vendor + multi-line) does **not** increase stock
- [ ] Partial GRN then remaining GRN; over-receive blocked; duplicate blocked
- [ ] Low-stock highlights and movements ledger update

### Reports & dashboard

- [ ] Dashboard sales/payments/outstanding/leads/open deals/low stock match modules
- [ ] Reports date filter + CSV; payments not counted as sales

**Do not claim browser E2E or physical printer testing is complete.**

---

## 6. Known limitations

- **Demo auth is not production-secure.** PBKDF2 hashing in the browser still leaves credentials, sessions, and permission maps in `localStorage`. Frontend route guards and client-side `can()` checks can be bypassed by a determined user inspecting storage or calling store APIs. Do **not** use real employee passwords or confidential business data. Do **not** deploy this temporary authentication system to production.
- WhatsApp / email delivery: **NotConfigured** (no live send)
- Data is browser `localStorage` demo storage, not multi-tenant cloud DB
- Print depends on browser pop-ups and local printers
- Header “Search…” is a local UI control, not a cross-module permissioned search index
- ESLint may still fail outside the formatted sprint file set if other files use CRLF
- No automated Playwright/Cypress suite

---

## 7. External integration requirements (Phase B)

See `src/features/invoices/WHATSAPP_META_SETUP.md` and `PHASE_B_LOVABLE.md`:

- Lovable-managed secrets (never `VITE_*` tokens)
- Delivery job table + private PDF storage
- Server adapters for Meta Cloud API / Resend
- Explicit customer opt-in
- `ALLOW_LIVE_DELIVERY` gate

**Do not send real WhatsApp/email without separate written approval.**

---

## 8. Troubleshooting

| Symptom                         | Fix                                     |
| ------------------------------- | --------------------------------------- |
| Stale numbers after reset       | Hard refresh (Ctrl+F5)                  |
| Print fails                     | Allow pop-ups for the app origin        |
| Duplicate quote convert blocked | Expected — already Converted            |
| Overpayment rejected            | Expected — amount must be ≤ balance     |
| Delivery shows NotConfigured    | Expected for this demo                  |
| PDF on seed invoice looks wrong | Reset demo data so snapshots regenerate |

---

## 9. Future commercial roadmap

1. Lovable schema: immutable invoice documents, PDF object storage, delivery jobs
2. Live Meta WhatsApp + Resend with tenant isolation
3. Replace demo localStorage auth with server-side auth, hashed secrets, and org multi-tenancy
4. Accounting export / GST filing packs
5. Warehouse locations (advanced inventory) after core AR is live in cloud

---

## 10. Demo readiness statement

**Application status for management demo:** Ready for a local walkthrough of Login → Role-aware Dashboard → Lead → Quote → Invoice → PDF → Payment → Admin Access / Development Status, with honest NotConfigured delivery and a manual browser checklist still required for presenters. Demo authentication remains temporary and local-only.
