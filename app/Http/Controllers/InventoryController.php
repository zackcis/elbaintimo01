<?php

namespace App\Http\Controllers;

use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function lowStock(Request $request): Response
    {
        $threshold = max(0, (int) config('harimi.inventory.low_stock_threshold', 10));
        $filter = (string) $request->query('filter', 'all');
        if (! in_array($filter, ['all', 'out', 'low'], true)) {
            $filter = 'all';
        }

        $locale = app()->getLocale();

        $query = ProductVariant::query()
            ->with([
                'product.translations' => fn ($q) => $q->whereIn('locale', [$locale, 'it']),
                'product.brand.translations' => fn ($q) => $q->whereIn('locale', [$locale, 'it']),
            ])
            ->where('stock', '<=', $threshold)
            ->orderBy('stock')
            ->orderBy('id');

        if ($filter === 'out') {
            $query->where('stock', '<=', 0);
        } elseif ($filter === 'low') {
            $query->where('stock', '>', 0)->where('stock', '<=', $threshold);
        }

        $variants = $query->paginate(25)->withQueryString()->through(function (ProductVariant $variant) use ($locale) {
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
                'id' => $variant->id,
                'product_id' => $variant->product_id,
                'product_title' => $title,
                'brand_name' => $brand,
                'size' => $variant->size,
                'color' => $variant->color,
                'color_hex' => $variant->color_hex,
                'stock' => (int) $variant->stock,
                'price' => number_format((float) $variant->price, 2, '.', ''),
                'is_out_of_stock' => (int) $variant->stock <= 0,
            ];
        });

        $counts = [
            'all' => ProductVariant::query()->where('stock', '<=', $threshold)->count(),
            'out' => ProductVariant::query()->where('stock', '<=', 0)->count(),
            'low' => ProductVariant::query()->where('stock', '>', 0)->where('stock', '<=', $threshold)->count(),
        ];

        return Inertia::render('inventory/low-stock', [
            'variants' => $variants,
            'threshold' => $threshold,
            'filter' => $filter,
            'counts' => $counts,
        ]);
    }
}
