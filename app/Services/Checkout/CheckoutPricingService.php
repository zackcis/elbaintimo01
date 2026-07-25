<?php

namespace App\Services\Checkout;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\StorefrontLocale;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

final class CheckoutPricingService
{
    /**
     * @param  list<array{variant_id: int, quantity: int}>  $items
     * @return array{
     *   locale: string,
     *   currency: string,
     *   items: list<array<string, mixed>>,
     *   subtotal: string,
     *   shipping_amount: string,
     *   tax_amount: string,
     *   total: string,
     *   prices_include_tax: bool,
     *   tax_rate: float,
     *   available: bool,
     *   errors: list<array{variant_id: int, message: string}>
     * }
     */
    public function preview(array $items, string $locale): array
    {
        $locale = StorefrontLocale::resolve($locale);
        $built = $this->buildLines($items, $locale);

        $subtotal = round($built['subtotal'], 2);
        $shipping = round((float) config('harimi.checkout.flat_shipping_amount', 5.90), 2);
        $pricesIncludeTax = (bool) config('harimi.checkout.prices_include_tax', true);
        $taxRate = (float) config('harimi.checkout.tax_rate', 0.22);

        $merchandiseAndShipping = round($subtotal + $shipping, 2);
        if ($pricesIncludeTax && $taxRate > 0) {
            $net = round($merchandiseAndShipping / (1 + $taxRate), 2);
            $tax = round($merchandiseAndShipping - $net, 2);
        } else {
            $tax = round($merchandiseAndShipping * $taxRate, 2);
            $merchandiseAndShipping = round($merchandiseAndShipping + $tax, 2);
        }

        return [
            'locale' => $locale,
            'currency' => (string) config('harimi.checkout.currency', 'EUR'),
            'items' => $built['lines'],
            'subtotal' => number_format($subtotal, 2, '.', ''),
            'shipping_amount' => number_format($shipping, 2, '.', ''),
            'tax_amount' => number_format($tax, 2, '.', ''),
            'total' => number_format($merchandiseAndShipping, 2, '.', ''),
            'prices_include_tax' => $pricesIncludeTax,
            'tax_rate' => $taxRate,
            'available' => $built['errors'] === [],
            'errors' => $built['errors'],
        ];
    }

    /**
     * @param  list<array{variant_id: int, quantity: int}>  $items
     * @return array{lines: list<array<string, mixed>>, subtotal: float, errors: list<array{variant_id: int, message: string}>}
     */
    public function buildLines(array $items, string $locale): array
    {
        $errors = [];
        $lines = [];
        $subtotal = 0.0;

        $ids = collect($items)->pluck('variant_id')->map(fn ($id) => (int) $id)->unique()->all();
        /** @var Collection<int, ProductVariant> $variants */
        $variants = ProductVariant::query()
            ->with(['product.translations', 'product.brand.translations'])
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        foreach ($items as $row) {
            $variantId = (int) $row['variant_id'];
            $qty = (int) $row['quantity'];
            $variant = $variants->get($variantId);

            if ($variant === null || $variant->product === null) {
                $errors[] = [
                    'variant_id' => $variantId,
                    'message' => 'Variant not found.',
                ];

                continue;
            }

            /** @var Product $product */
            $product = $variant->product;

            if (! $product->is_published) {
                $errors[] = [
                    'variant_id' => $variantId,
                    'message' => 'Product is not available.',
                ];

                continue;
            }

            if ($qty < 1) {
                $errors[] = [
                    'variant_id' => $variantId,
                    'message' => 'Quantity must be at least 1.',
                ];

                continue;
            }

            if ((int) $variant->stock < $qty) {
                $errors[] = [
                    'variant_id' => $variantId,
                    'message' => 'Insufficient stock.',
                ];

                continue;
            }

            $unit = round((float) $variant->price, 2);
            $lineTotal = round($unit * $qty, 2);
            $subtotal += $lineTotal;

            $lines[] = [
                'variant_id' => $variant->id,
                'product_id' => $product->id,
                'product_name' => $product->titleForLocale($locale),
                'product_slug' => $product->slugForLocale($locale),
                'size' => $variant->size,
                'color' => $variant->color,
                'color_hex' => $variant->color_hex,
                'quantity' => $qty,
                'unit_price' => number_format($unit, 2, '.', ''),
                'line_total' => number_format($lineTotal, 2, '.', ''),
                'stock' => (int) $variant->stock,
                'in_stock' => true,
            ];
        }

        return [
            'lines' => $lines,
            'subtotal' => $subtotal,
            'errors' => $errors,
        ];
    }

    public function assertAvailable(array $items, string $locale): array
    {
        $preview = $this->preview($items, $locale);
        if (! $preview['available']) {
            throw ValidationException::withMessages([
                'items' => collect($preview['errors'])->pluck('message')->all(),
            ]);
        }

        return $preview;
    }
}
