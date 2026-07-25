<?php

namespace App\Services\Checkout;

final class StripeCheckoutSessionResult
{
    public function __construct(
        public readonly string $id,
        public readonly string $url,
        public readonly ?string $paymentIntentId = null,
    ) {}
}
