# Phase B — Lovable schema & delivery adapters

Phase A stores snapshots, prefs and delivery jobs in browser storage and never sends live WhatsApp/email.

For Meta test-number setup and server secret names, see [`WHATSAPP_META_SETUP.md`](./WHATSAPP_META_SETUP.md).

When ready in Lovable, add organization-scoped tables/fields (do not hand-edit migrations):

## Suggested tables
- `invoice_documents` — immutable issued snapshot JSON, template id/version, totals, status
- `invoice_pdfs` — private storage path per document + paper/template
- `invoice_delivery_jobs` — channel, status, idempotency key, provider ids, retries
- `org_invoice_preferences` — defaults, logo, brand color, field visibility, numbering

## Secrets (Lovable Secrets / env)
- WhatsApp Business Cloud: access token, phone number id, optional template name
- Resend or SMTP credentials
- Storage bucket credentials for private PDFs

## Server work
- TanStack Start server functions for issue, signed PDF download, enqueue/retry delivery
- Replace `deliveryService` adapters to call providers; keep the same UI status model
- Enforce tenant isolation on every read/write
