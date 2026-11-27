# WhatsApp Cloud API — Meta test setup (Phase B)

Phase A never sends live WhatsApp messages. Delivery jobs stay `NotConfigured` until Lovable secrets and server adapters exist. Do **not** put access tokens in `VITE_*` env vars (those are exposed to the browser).

## Prerequisites

1. Meta Business account + WhatsApp Business app
2. A test phone number from Meta’s WhatsApp Cloud API dashboard
3. An approved **utility** template that can attach a document (or a template your test number can use in sandbox)
4. Customer opt-in captured on the customer record (`whatsappNumber` + business process)

## Secrets (Lovable Secrets / server env only)

| Secret | Purpose |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Cloud API permanent or system user token |
| `WHATSAPP_PHONE_NUMBER_ID` | Sending phone number id |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Optional, for template management |
| `WHATSAPP_TEMPLATE_NAME` | Approved utility template name |
| `WHATSAPP_TEMPLATE_LANGUAGE` | e.g. `en` |
| `ALLOW_LIVE_DELIVERY` | Must be `true` to enable real sends |

## Suggested test steps (after Phase B wiring)

1. Add secrets in Lovable; never commit them.
2. Set customer WhatsApp to Meta’s **test recipient** number.
3. Confirm opt-in is recorded for that customer.
4. Issue an invoice → PDF generated → delivery job created with idempotency key `{invoiceId}:whatsapp:{number}`.
5. Server adapter uploads/sends the PDF document to the Cloud API.
6. UI shows real provider status (`Sent` / `Failed`) — never fake success in the client.
7. Retry uses the same idempotency key.

## Exact remaining requirements (checklist)

| Requirement | Status |
|---|---|
| Lovable secrets for Meta token + phone number id | Missing |
| Server-only adapter (never `VITE_*` tokens) | Missing |
| Customer WhatsApp E.164 normalization | Frontend field exists; server normalize still needed |
| Customer opt-in flag / consent audit | Partial (`whatsappNumber` only) — add explicit opt-in boolean in Phase B |
| Private PDF bytes for Media upload | Local blob only today |
| Approved utility template + language | Not configured |
| Delivery job table + idempotency | Client localStorage stub only |
| Retry + real provider status mapping | UI ready; provider wiring missing |
| `ALLOW_LIVE_DELIVERY=true` gate | Documented; not implemented server-side |
| Demo reset clears local delivery jobs | Implemented (`clearDeliveryJobs`) |

**Demo rule:** UI must continue showing **NotConfigured** (or Failed if stray VITE keys exist). Never simulate `Sent`.

## Blockers in this repo today

- No Lovable-managed `invoice_delivery_jobs` table
- No private PDF object storage
- No TanStack Start server adapter calling Meta
- Client `deliveryService` intentionally returns `NotConfigured` or development `Failed`
- Demo UI must continue showing **NotConfigured** (never fake `Sent`)

See also `PHASE_B_LOVABLE.md` and email setup notes below.

## Email (Resend / SMTP)

| Secret | Purpose |
|---|---|
| `RESEND_API_KEY` or `SMTP_URL` | Server-side only |
| `EMAIL_FROM` | Verified sender |
| `ALLOW_LIVE_DELIVERY` | Must be `true` for real sends |

Until those exist, email delivery remains `NotConfigured`. Do not send real email without explicit approval.
