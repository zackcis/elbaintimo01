<?php

namespace Tests\Feature;

use Tests\TestCase;

class StripeSmokePreflightTest extends TestCase
{
    public function test_preflight_fails_on_fake_stripe_secret(): void
    {
        config([
            'services.stripe.key' => 'pk_test_xxx',
            'services.stripe.secret' => 'sk_test_harimi_fake',
            'services.stripe.webhook_secret' => 'whsec_harimi_fake',
        ]);

        $this->artisan('harimi:stripe-smoke-preflight')
            ->assertFailed();
    }

    public function test_preflight_passes_with_real_looking_keys(): void
    {
        config([
            'services.stripe.key' => 'pk_test_reallookingkey123',
            'services.stripe.secret' => 'sk_test_reallookingkey123',
            'services.stripe.webhook_secret' => 'whsec_reallookingsecret',
            'harimi.storefront_origins' => ['http://localhost:3000'],
            'app.url' => 'http://localhost:8000',
        ]);

        $this->artisan('harimi:stripe-smoke-preflight')
            ->expectsOutputToContain('Preflight passed')
            ->assertSuccessful();
    }
}
