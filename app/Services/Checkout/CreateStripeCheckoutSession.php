<?php

namespace App\Services\Checkout;

use App\Models\Command;
use Illuminate\Support\Str;
use RuntimeException;
use Stripe\StripeClient;

final class CreateStripeCheckoutSession
{
    public function handle(Command $order, string $successUrl, string $cancelUrl): StripeCheckoutSessionResult
    {
        $secret = config('services.stripe.secret');
        if (! is_string($secret) || $secret === '') {
            throw new RuntimeException('Stripe secret key is not configured.');
        }

        $order->loadMissing('items');

        // Test / local fake: avoid real Stripe HTTP when using the documented fake secret.
        if ($secret === 'sk_test_harimi_fake') {
            $result = new StripeCheckoutSessionResult(
                id: 'cs_test_'.Str::lower(Str::random(24)),
                url: 'https://checkout.stripe.com/c/pay/cs_test_harimi_fake',
                paymentIntentId: null,
            );

            $order->forceFill([
                'stripe_checkout_session_id' => $result->id,
            ])->save();

            return $result;
        }

        $lineItems = [];
        foreach ($order->items as $item) {
            $name = $item->product_name;
            $variantBits = trim(implode(' / ', array_filter([$item->size, $item->color])));
            if ($variantBits !== '') {
                $name .= ' ('.$variantBits.')';
            }

            $lineItems[] = [
                'quantity' => (int) $item->quantity,
                'price_data' => [
                    'currency' => strtolower((string) ($order->currency ?: 'eur')),
                    'unit_amount' => (int) round(((float) $item->unit_price) * 100),
                    'product_data' => [
                        'name' => $name,
                    ],
                ],
            ];
        }

        $shippingAmount = (int) round(((float) ($order->shipping_amount ?? 0)) * 100);
        if ($shippingAmount > 0) {
            $lineItems[] = [
                'quantity' => 1,
                'price_data' => [
                    'currency' => strtolower((string) ($order->currency ?: 'eur')),
                    'unit_amount' => $shippingAmount,
                    'product_data' => [
                        'name' => 'Shipping',
                    ],
                ],
            ];
        }

        $stripe = new StripeClient($secret);

        // Do not pass payment_method_types — enable dynamic payment methods via Dashboard.
        $session = $stripe->checkout->sessions->create([
            'mode' => 'payment',
            'customer_email' => $order->client_email,
            'client_reference_id' => $order->reference,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'line_items' => $lineItems,
            'metadata' => [
                'order_reference' => $order->reference,
                'confirmation_token' => (string) $order->confirmation_token,
            ],
        ]);

        $paymentIntentId = is_string($session->payment_intent) ? $session->payment_intent : null;

        $order->forceFill([
            'stripe_checkout_session_id' => $session->id,
            'stripe_payment_intent_id' => $paymentIntentId,
        ])->save();

        return new StripeCheckoutSessionResult(
            id: $session->id,
            url: (string) $session->url,
            paymentIntentId: $paymentIntentId,
        );
    }
}
