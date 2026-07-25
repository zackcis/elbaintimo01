# Staging / production env readiness

Complete before taking a paid test order on a shared host.

## Back office (`HarimiBackOffice`)

```env
APP_ENV=staging
APP_DEBUG=false
APP_URL=https://bo.example.com

HARIMI_STOREFRONT_ORIGINS=https://shop.example.com
HARIMI_PUBLIC_DEFAULT_LOCALE=it
HARIMI_ADMIN_LIST_LOCALE=it
HARIMI_CURRENCY=EUR
HARIMI_FLAT_SHIPPING_AMOUNT=5.90
HARIMI_PRICES_INCLUDE_TAX=true
HARIMI_TAX_RATE=0.22
HARIMI_ABANDONED_CHECKOUT_HOURS=24
HARIMI_LOW_STOCK_THRESHOLD=10
HARIMI_LOW_STOCK_DIGEST_ENABLED=true
HARIMI_LOW_STOCK_DIGEST_TIME=08:00
HARIMI_LOW_STOCK_DIGEST_RECIPIENTS=ops@example.com

# Test mode first on staging; switch to live keys only after smoke is green
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME=HARIMI
```

### Checklist

- [ ] `APP_URL` is the public BO URL (used in digest admin links)
- [ ] Stripe Dashboard webhook endpoint: `POST {APP_URL}/api/v1/webhooks/stripe`
  - Events: `checkout.session.completed`, `charge.refunded`, `refund.updated`
- [ ] CORS origins match the live storefront origin(s)
- [ ] Mail delivers (or `log` on first staging day)
- [ ] Scheduler cron: `* * * * * php /path/to/artisan schedule:run`
  - Jobs: `harimi:expire-abandoned-checkouts` (hourly), `harimi:send-low-stock-digest` (daily)
- [ ] `php artisan storage:link` if local disk media
- [ ] HTTPS only; `SESSION_SECURE_COOKIE=true` when behind HTTPS

## Storefront (`storeFront`)

```env
NEXT_PUBLIC_API_BASE_URL=https://bo.example.com/api/v1
NEXT_PUBLIC_SITE_URL=https://shop.example.com
NEXT_PUBLIC_SITE_NAME=HARIMI
```

### Checklist

- [ ] API base reachable from the Next host (SSR)
- [ ] `SITE_URL` used for canonical / sitemap / OG
- [ ] Build succeeds: `npm run build`

## Smoke on staging

Follow [stripe-smoke-checklist.md](./stripe-smoke-checklist.md) against staging URLs (not localhost). Prefer test keys on staging; live keys only for final prod cut.
