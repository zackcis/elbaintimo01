<?php

namespace App\Services\Checkout;

use App\Enums\PaymentStatus;
use App\Mail\OrderConfirmationMail;
use App\Models\Command;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

final class FinalizePaidOrder
{
    /**
     * Idempotent: safe to call multiple times for the same paid order.
     */
    public function handle(Command $order, ?string $paymentIntentId = null): Command
    {
        return DB::transaction(function () use ($order, $paymentIntentId) {
            /** @var Command $locked */
            $locked = Command::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->with('items')
                ->firstOrFail();

            if ($locked->payment_status === PaymentStatus::Paid) {
                return $locked;
            }

            foreach ($locked->items as $item) {
                if (! $item->product_variant_id) {
                    continue;
                }

                /** @var ProductVariant|null $variant */
                $variant = ProductVariant::query()
                    ->whereKey($item->product_variant_id)
                    ->lockForUpdate()
                    ->first();

                if ($variant === null) {
                    continue;
                }

                $qty = (int) $item->quantity;
                if ($variant->stock < $qty) {
                    // Money already taken — clamp stock; ops can reconcile.
                    $variant->stock = 0;
                } else {
                    $variant->stock = $variant->stock - $qty;
                }
                $variant->save();
            }

            $client = User::query()
                ->where('email', $locked->client_email)
                ->first();

            if ($client === null) {
                $client = User::query()->create([
                    'name' => $locked->client_name,
                    'email' => $locked->client_email,
                    'phone' => $locked->client_phone,
                    'address' => trim(implode(', ', array_filter([
                        $locked->shipping_line1,
                        $locked->shipping_line2,
                        $locked->shipping_postal_code,
                        $locked->shipping_city,
                        $locked->shipping_province,
                        $locked->shipping_country,
                    ]))),
                    'password' => Str::password(32),
                    'role' => 'client',
                ]);
                $client->forceFill(['email_verified_at' => now()])->save();
            } else {
                $client->forceFill([
                    'role' => in_array($client->role, ['staff', 'admin'], true)
                        ? $client->role
                        : 'client',
                    'phone' => $locked->client_phone ?: $client->phone,
                ])->save();
            }

            $locked->forceFill([
                'client_id' => $client->id,
                'payment_status' => PaymentStatus::Paid,
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'paid_at' => now(),
                'stripe_payment_intent_id' => $paymentIntentId ?: $locked->stripe_payment_intent_id,
            ])->save();

            Mail::to($locked->client_email)->send(new OrderConfirmationMail($locked->fresh('items')));

            return $locked->fresh('items');
        });
    }
}
