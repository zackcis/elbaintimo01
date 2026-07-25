# Client decisions — soft launch defaults

Logged for sprint close. Change only when the client overrides.

| Topic | Decision for soft launch | Config / notes |
|---|---|---|
| Shelf prices vs IVA | **IVA inclusa** (prices include tax) | `HARIMI_PRICES_INCLUDE_TAX=true`, `HARIMI_TAX_RATE=0.22` |
| Shipping rates | **Flat Italy shipping** €5.90 | `HARIMI_FLAT_SHIPPING_AMOUNT=5.90` — no free-shipping threshold yet |
| Customer fiscal document | **B2C confirmation email only** (not e-invoice) | Keep `OrderConfirmationMail` / ship / refund mails; e-invoice = post-launch |
| Stripe Checkout UI | **Hosted Checkout** (not embedded) | Already implemented |
| Size / returns policy | Static pages shipped in storefront; legal text is placeholder-ready for lawyer review | `/[locale]/size-guide`, `/[locale]/shipping-returns` |

When the client answers differently: update `.env`, checkout copy, and this file in the same PR.
