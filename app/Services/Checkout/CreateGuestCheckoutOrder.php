<?php

namespace App\Services\Checkout;

use App\Enums\PaymentStatus;
use App\Models\Command;
use App\Models\CommandItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreateGuestCheckoutOrder
{
    public function __construct(
        private readonly CheckoutPricingService $pricing,
    ) {}

    /**
     * Creates a storefront order in pending_payment state.
     * Stock is checked but NOT decremented until Stripe payment succeeds.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handle(array $payload): Command
    {
        $locale = (string) $payload['locale'];
        $items = $payload['items'];
        $idempotencyKey = $payload['idempotency_key'] ?? null;

        if (is_string($idempotencyKey) && $idempotencyKey !== '') {
            $existing = Command::query()
                ->where('idempotency_key', $idempotencyKey)
                ->where('source', 'storefront')
                ->first();

            if ($existing) {
                return $existing->load('items');
            }
        }

        $quote = $this->pricing->assertAvailable($items, $locale);

        $billingSame = (bool) ($payload['billing_same_as_shipping'] ?? true);
        $shipping = $payload['shipping_address'];
        $billing = $billingSame
            ? $shipping
            : ($payload['billing_address'] ?? $shipping);

        return DB::transaction(function () use ($payload, $quote, $locale, $shipping, $billing, $billingSame, $idempotencyKey) {
            // Re-check stock inside the transaction.
            $this->pricing->assertAvailable($payload['items'], $locale);

            $command = Command::query()->create([
                'reference' => Command::generateReference(),
                'client_name' => $payload['customer']['name'],
                'client_email' => $payload['customer']['email'],
                'client_phone' => $payload['customer']['phone'] ?? null,
                'locale' => $locale,
                'currency' => $quote['currency'],
                'fulfillment_type' => Command::FULFILLMENT_SHIP,
                'billing_same_as_shipping' => $billingSame,
                'shipping_line1' => $shipping['line1'],
                'shipping_line2' => $shipping['line2'] ?? null,
                'shipping_city' => $shipping['city'],
                'shipping_province' => $shipping['province'],
                'shipping_postal_code' => $shipping['postal_code'],
                'shipping_country' => strtoupper($shipping['country'] ?? 'IT'),
                'billing_line1' => $billing['line1'],
                'billing_line2' => $billing['line2'] ?? null,
                'billing_city' => $billing['city'],
                'billing_province' => $billing['province'],
                'billing_postal_code' => $billing['postal_code'],
                'billing_country' => strtoupper($billing['country'] ?? 'IT'),
                'status' => 'pending',
                'payment_status' => PaymentStatus::PendingPayment->value,
                'confirmation_token' => Str::random(64),
                'subtotal_amount' => $quote['subtotal'],
                'shipping_amount' => $quote['shipping_amount'],
                'tax_amount' => $quote['tax_amount'],
                'total_amount' => $quote['total'],
                'notes' => $payload['notes'] ?? null,
                'source' => 'storefront',
                'idempotency_key' => is_string($idempotencyKey) && $idempotencyKey !== '' ? $idempotencyKey : null,
            ]);

            foreach ($quote['items'] as $line) {
                $variantLabel = trim(implode(' / ', array_filter([
                    $line['size'] ?? null,
                    $line['color'] ?? null,
                ])));

                CommandItem::query()->create([
                    'command_id' => $command->id,
                    'product_id' => $line['product_id'],
                    'product_variant_id' => $line['variant_id'],
                    'product_name' => $line['product_name'],
                    'variant' => $variantLabel !== '' ? $variantLabel : null,
                    'size' => $line['size'] ?? null,
                    'color' => $line['color'] ?? null,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'total_price' => $line['line_total'],
                ]);
            }

            return $command->load('items');
        });
    }
}
