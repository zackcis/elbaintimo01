<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Command
 */
class CheckoutOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $paymentStatus = $this->payment_status;
        $paymentStatusValue = is_object($paymentStatus) ? $paymentStatus->value : (string) $paymentStatus;

        return [
            'reference' => $this->reference,
            'status' => $this->status,
            'payment_status' => $paymentStatusValue,
            'confirmation_token' => $this->confirmation_token,
            'locale' => $this->locale,
            'currency' => $this->currency ?? 'EUR',
            'fulfillment_type' => $this->fulfillment_type,
            'customer' => [
                'name' => $this->client_name,
                'email' => $this->client_email,
                'phone' => $this->client_phone,
            ],
            'shipping_address' => [
                'line1' => $this->shipping_line1,
                'line2' => $this->shipping_line2,
                'city' => $this->shipping_city,
                'province' => $this->shipping_province,
                'postal_code' => $this->shipping_postal_code,
                'country' => $this->shipping_country,
            ],
            'billing_same_as_shipping' => (bool) $this->billing_same_as_shipping,
            'billing_address' => [
                'line1' => $this->billing_line1,
                'line2' => $this->billing_line2,
                'city' => $this->billing_city,
                'province' => $this->billing_province,
                'postal_code' => $this->billing_postal_code,
                'country' => $this->billing_country,
            ],
            'subtotal_amount' => number_format((float) ($this->subtotal_amount ?? 0), 2, '.', ''),
            'shipping_amount' => number_format((float) ($this->shipping_amount ?? 0), 2, '.', ''),
            'tax_amount' => number_format((float) ($this->tax_amount ?? 0), 2, '.', ''),
            'total_amount' => number_format((float) $this->total_amount, 2, '.', ''),
            'notes' => $this->notes,
            'paid_at' => optional($this->paid_at)?->toIso8601String(),
            'shipped_at' => optional($this->shipped_at)?->toIso8601String(),
            'shipment' => [
                'carrier' => $this->shipping_carrier,
                'tracking_number' => $this->tracking_number,
                'tracking_url' => $this->tracking_url,
            ],
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(fn ($item) => [
                    'product_name' => $item->product_name,
                    'variant_id' => $item->product_variant_id,
                    'size' => $item->size,
                    'color' => $item->color,
                    'quantity' => (int) $item->quantity,
                    'unit_price' => number_format((float) $item->unit_price, 2, '.', ''),
                    'line_total' => number_format((float) $item->total_price, 2, '.', ''),
                ])->values();
            }),
            'payment' => [
                'mode' => match ($paymentStatusValue) {
                    'paid' => 'paid',
                    'refunded' => 'refunded',
                    default => 'stripe_checkout',
                },
                'checkout_session_id' => $this->stripe_checkout_session_id,
                'checkout_url' => $this->checkout_url ?? null,
            ],
            'created_at' => optional($this->created_at)?->toIso8601String(),
        ];
    }
}
