<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class StripeSmokePreflightCommand extends Command
{
    protected $signature = 'harimi:stripe-smoke-preflight';

    protected $description = 'Verify Stripe env is ready for the manual smoke checklist';

    public function handle(): int
    {
        $ok = true;

        $secret = (string) config('services.stripe.secret');
        $webhook = (string) config('services.stripe.webhook_secret');
        $key = (string) config('services.stripe.key');
        $origins = config('harimi.storefront_origins', []);

        $checks = [
            'STRIPE_KEY set' => $key !== '' && ! str_contains($key, 'xxx'),
            'STRIPE_SECRET looks like a real test/live key' => (str_starts_with($secret, 'sk_test_') || str_starts_with($secret, 'sk_live_'))
                && $secret !== 'sk_test_harimi_fake',
            'STRIPE_SECRET is not the fake test stub' => $secret !== 'sk_test_harimi_fake',
            'STRIPE_WEBHOOK_SECRET set' => $webhook !== '' && $webhook !== 'whsec_harimi_fake',
            'HARIMI_STOREFRONT_ORIGINS non-empty' => is_array($origins) && count($origins) > 0,
            'APP_URL set' => filled(config('app.url')),
        ];

        foreach ($checks as $label => $pass) {
            if ($pass) {
                $this->info("[ok] {$label}");
            } else {
                $this->error("[fail] {$label}");
                $ok = false;
            }
        }

        if (! $ok) {
            $this->newLine();
            $this->warn('Replace placeholder Stripe keys in .env, then run:');
            $this->line('  stripe listen --forward-to '.rtrim((string) config('app.url'), '/').'/api/v1/webhooks/stripe');
            $this->line('See docs/stripe-smoke-checklist.md');

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Preflight passed. Continue with docs/stripe-smoke-checklist.md (pay / cancel / ship / refund).');

        return self::SUCCESS;
    }
}
