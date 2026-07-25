<?php

namespace App\Services\Checkout;

use App\Enums\PaymentStatus;
use App\Models\Command;
use Illuminate\Support\Carbon;

final class ExpireAbandonedCheckoutOrders
{
    /**
     * Cancel unpaid storefront orders older than the configured TTL.
     * Stock was never decremented for pending_payment, so no restock is needed.
     *
     * @return array{expired: int, references: list<string>}
     */
    public function handle(?int $olderThanHours = null, bool $dryRun = false): array
    {
        $hours = $olderThanHours ?? (int) config('harimi.checkout.abandoned_checkout_hours', 24);
        if ($hours < 1) {
            $hours = 24;
        }

        $cutoff = Carbon::now()->subHours($hours);

        $query = Command::query()
            ->where('source', 'storefront')
            ->where('payment_status', PaymentStatus::PendingPayment)
            ->where('status', '!=', 'cancelled')
            ->where('created_at', '<', $cutoff)
            ->orderBy('id');

        $references = [];
        $expired = 0;

        $query->chunkById(100, function ($orders) use (&$references, &$expired, $dryRun): void {
            foreach ($orders as $order) {
                /** @var Command $order */
                $references[] = $order->reference;
                $expired++;

                if ($dryRun) {
                    continue;
                }

                $order->forceFill([
                    'status' => 'cancelled',
                    'payment_status' => PaymentStatus::Cancelled,
                    'cancelled_at' => now(),
                ])->save();
            }
        });

        return [
            'expired' => $expired,
            'references' => $references,
        ];
    }
}
