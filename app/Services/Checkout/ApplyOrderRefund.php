<?php

namespace App\Services\Checkout;

use App\Enums\PaymentStatus;
use App\Mail\OrderRefundedMail;
use App\Models\Command;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

final class ApplyOrderRefund
{
    /**
     * Local refund side-effects: restock + mark refunded + email. Idempotent.
     */
    public function handle(Command $order, ?string $refundId = null): Command
    {
        $shouldNotify = false;

        $result = DB::transaction(function () use ($order, $refundId, &$shouldNotify) {
            /** @var Command $locked */
            $locked = Command::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->with('items')
                ->firstOrFail();

            if ($locked->payment_status === PaymentStatus::Refunded) {
                if ($refundId && ! $locked->stripe_refund_id) {
                    $locked->forceFill(['stripe_refund_id' => $refundId])->save();
                }

                return $locked->fresh('items');
            }

            if ($locked->payment_status !== PaymentStatus::Paid) {
                throw ValidationException::withMessages([
                    'payment' => 'Only paid orders can be refunded.',
                ]);
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

                $variant->stock = $variant->stock + (int) $item->quantity;
                $variant->save();
            }

            $locked->forceFill([
                'payment_status' => PaymentStatus::Refunded,
                'status' => 'cancelled',
                'cancelled_at' => $locked->cancelled_at ?? now(),
                'refunded_at' => now(),
                'stripe_refund_id' => $refundId ?: $locked->stripe_refund_id,
            ])->save();

            $shouldNotify = true;

            return $locked->fresh('items');
        });

        if ($shouldNotify && $result->client_email) {
            Mail::to($result->client_email)->send(new OrderRefundedMail($result));
        }

        return $result;
    }
}
