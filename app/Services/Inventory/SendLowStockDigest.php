<?php

namespace App\Services\Inventory;

use App\Mail\LowStockDigestMail;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;

class SendLowStockDigest
{
    /**
     * @return array{sent: int, skipped: bool, reason: ?string, out_count: int, low_count: int, recipients: list<string>}
     */
    public function handle(bool $dryRun = false, bool $force = false): array
    {
        if (! $force && ! config('harimi.inventory.digest_enabled', true)) {
            return $this->result(0, true, 'disabled', 0, 0, []);
        }

        $threshold = max(0, (int) config('harimi.inventory.low_stock_threshold', 10));
        $locale = (string) config('harimi.admin_list_locale', 'it');

        $variants = ProductVariant::query()
            ->with([
                'product.translations' => fn ($q) => $q->whereIn('locale', [$locale, 'it']),
                'product.brand.translations' => fn ($q) => $q->whereIn('locale', [$locale, 'it']),
            ])
            ->where('stock', '<=', $threshold)
            ->orderBy('stock')
            ->orderBy('id')
            ->get();

        $outCount = $variants->where('stock', '<=', 0)->count();
        $lowCount = $variants->where('stock', '>', 0)->count();

        if ($variants->isEmpty()) {
            return $this->result(0, true, 'no_alerts', 0, 0, []);
        }

        $recipients = $this->recipients();
        if ($recipients->isEmpty()) {
            return $this->result(0, true, 'no_recipients', $outCount, $lowCount, []);
        }

        $rows = $variants->map(function (ProductVariant $variant) use ($locale) {
            $product = $variant->product;
            $title = $product?->translations
                ->firstWhere('locale', $locale)
                ?->title
                ?? $product?->translations->firstWhere('locale', 'it')?->title
                ?? '—';
            $brand = $product?->brand?->translations
                ->firstWhere('locale', $locale)
                ?->name
                ?? $product?->brand?->translations->firstWhere('locale', 'it')?->name;

            return [
                'product_title' => $title,
                'brand_name' => $brand,
                'size' => $variant->size,
                'color' => $variant->color,
                'stock' => (int) $variant->stock,
                'is_out_of_stock' => (int) $variant->stock <= 0,
            ];
        })->all();

        $adminUrl = route('inventory.low-stock', ['locale' => $locale]);

        if (! $dryRun) {
            foreach ($recipients as $email) {
                Mail::to($email)->send(new LowStockDigestMail(
                    threshold: $threshold,
                    outCount: $outCount,
                    lowCount: $lowCount,
                    rows: $rows,
                    adminUrl: $adminUrl,
                ));
            }
        }

        return $this->result(
            $recipients->count(),
            false,
            null,
            $outCount,
            $lowCount,
            $recipients->all(),
        );
    }

    /**
     * @return Collection<int, string>
     */
    private function recipients(): Collection
    {
        $configured = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) config('harimi.inventory.digest_recipients', ''))
        )));

        if ($configured !== []) {
            return collect($configured)->unique()->values();
        }

        return User::query()
            ->whereIn('role', ['staff', 'admin'])
            ->whereNotNull('email')
            ->pluck('email')
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * @param  list<string>  $recipients
     * @return array{sent: int, skipped: bool, reason: ?string, out_count: int, low_count: int, recipients: list<string>}
     */
    private function result(
        int $sent,
        bool $skipped,
        ?string $reason,
        int $outCount,
        int $lowCount,
        array $recipients,
    ): array {
        return [
            'sent' => $sent,
            'skipped' => $skipped,
            'reason' => $reason,
            'out_count' => $outCount,
            'low_count' => $lowCount,
            'recipients' => $recipients,
        ];
    }
}
