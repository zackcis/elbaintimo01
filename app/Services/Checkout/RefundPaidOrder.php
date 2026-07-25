<?php

namespace App\Services\Checkout;

use App\Enums\PaymentStatus;
use App\Models\Command;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Stripe\StripeClient;

final class RefundPaidOrder
{
    public function __construct(
        private readonly ApplyOrderRefund $applyRefund,
    ) {}

    /**
     * Full Stripe refund + local restock/status update. Idempotent if already refunded.
     */
    public function handle(Command $order): Command
    {
        if ($order->payment_status === PaymentStatus::Refunded) {
            return $order->loadMissing('items');
        }

        if ($order->payment_status !== PaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'payment' => 'Only paid orders can be refunded.',
            ]);
        }

        if ($order->source !== 'storefront') {
            throw ValidationException::withMessages([
                'payment' => 'Only storefront Stripe orders can be refunded here.',
            ]);
        }

        $refundId = $this->createStripeRefund($order);

        return $this->applyRefund->handle($order, $refundId);
    }

    private function createStripeRefund(Command $order): string
    {
        $secret = config('services.stripe.secret');
        if (! is_string($secret) || $secret === '') {
            throw new RuntimeException('Stripe secret key is not configured.');
        }

        if ($secret === 'sk_test_harimi_fake') {
            return 're_test_'.Str::lower(Str::random(24));
        }

        $paymentIntentId = $order->stripe_payment_intent_id;
        if (! is_string($paymentIntentId) || $paymentIntentId === '') {
            throw ValidationException::withMessages([
                'payment' => 'Missing Stripe payment intent for this order.',
            ]);
        }

        $stripe = new StripeClient($secret);
        $refund = $stripe->refunds->create([
            'payment_intent' => $paymentIntentId,
            'reason' => 'requested_by_customer',
            'metadata' => [
                'order_reference' => $order->reference,
            ],
        ]);

        return (string) $refund->id;
    }
}
