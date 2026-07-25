# Stripe smoke checklist (Harimi)

End-to-end verification of hosted Stripe Checkout against local Laravel + Next storefront. Use **test mode** keys only.

## 0. Automated preflight

```bash
cd HarimiBackOffice
php artisan harimi:stripe-smoke-preflight
```

Must exit **0** before the manual steps below. Automated webhook/path coverage: `php artisan test --filter=CheckoutApiTest`.

## Prerequisites

- [ ] Laravel BO running (`php artisan serve` or Valet/Herd) — API at `http://127.0.0.1:8000`
- [ ] Storefront running (`npm run dev` in `storeFront/`) — typically `http://localhost:3000`
- [ ] Catalog has at least one **published** product with **in-stock** variants
- [ ] Mail driver set so confirmation can be observed (`MAIL_MAILER=log` is fine)
- [ ] Scheduler optional for this smoke (abandoned checkout / low-stock digest)

## 1. Stripe Dashboard (test mode)

- [ ] Create/open Stripe account → toggle **Test mode**
- [ ] Developers → API keys → copy **Publishable** (`pk_test_…`) and **Secret** (`sk_test_…`)
- [ ] Install Stripe CLI: https://stripe.com/docs/stripe-cli

## 2. Backend env (`HarimiBackOffice/.env`)

```env
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from CLI step 3 (or Dashboard endpoint)
```

Also confirm storefront CORS / origins:

```env
HARIMI_STOREFRONT_ORIGINS=http://localhost:3000
```

- [ ] Keys saved
- [ ] `php artisan config:clear` after editing `.env`

## 3. Forward webhooks (CLI)

In a dedicated terminal:

```bash
stripe listen --forward-to http://127.0.0.1:8000/api/v1/webhooks/stripe
```

- [ ] CLI prints a signing secret `whsec_…`
- [ ] That value is in `STRIPE_WEBHOOK_SECRET` (restart PHP if needed)
- [ ] Leave `stripe listen` running for the whole smoke

Events to expect later: `checkout.session.completed` (and optionally `charge.refunded` on refund).

## 4. Happy path — pay an order

1. Open storefront → pick audience → add an in-stock variant to bag → checkout.
2. Submit guest shipping (IT address) → redirected to Stripe Checkout.
3. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.
4. Land on confirmation URL with `reference` + `token`.

Verify:

- [ ] Stripe Checkout session completes
- [ ] `stripe listen` shows `checkout.session.completed` → **200** from Laravel
- [ ] Confirmation page moves from pending → **paid** (poll ~60s)
- [ ] Cart clears after paid
- [ ] Admin → Ordini → order is `paid` / confirmed, Stripe IDs present
- [ ] Variant stock decremented by qty purchased
- [ ] Client CRM row upserted by email
- [ ] Confirmation mail logged/sent (`storage/logs/laravel.log` if `MAIL_MAILER=log`)

## 5. Cancel path — keep bag

1. Start checkout again → on Stripe, click **Back** / cancel.
2. Return to storefront cancel URL.

Verify:

- [ ] Order stays `pending_payment` (until abandoned TTL)
- [ ] Cart still has items
- [ ] No stock decrement

## 6. Admin ship + tracking

On a **paid** order in BO:

- [ ] Enter carrier / tracking number / optional URL
- [ ] Set status **Spedito**
- [ ] Shipped mail logged/sent once
- [ ] Storefront confirmation shows shipment block (refresh / reopen with token)

## 7. Admin refund

On the same paid order (before or after ship — product allows refund when paid):

- [ ] Click **Rimborsa** / Refund → confirm
- [ ] Stripe Dashboard shows full refund
- [ ] Order `payment_status=refunded`, stock restored
- [ ] Refund mail logged/sent once
- [ ] Optional: Dashboard-initiated refund also syncs via `charge.refunded` while CLI is listening

## 8. Failure signals (quick)

| Symptom | Likely cause |
|---|---|
| Place order 500 / no `checkout_url` | Missing/invalid `STRIPE_SECRET` |
| Webhook 400 signature | Wrong `STRIPE_WEBHOOK_SECRET` or not using CLI secret |
| Paid on Stripe but confirmation stays pending | Webhook not forwarded / failed |
| CORS errors from Next | `HARIMI_STOREFRONT_ORIGINS` mismatch |

## 9. Done criteria

- [ ] One full paid order finalized by webhook
- [ ] One cancelled checkout keeps cart
- [ ] One ship with tracking visible on confirmation
- [ ] One refund with restock + email

When this checklist is green, test keys are ready for a staging deploy (still test mode) before live keys.
