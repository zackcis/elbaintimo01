<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Product
 */
class ProductCardResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = (string) ($request->attributes->get('storefront_locale') ?? app('storefront.locale'));

        $variants = $this->relationLoaded('variants') ? $this->variants : collect();
        $prices = $variants->pluck('price')->filter()->map(fn ($p) => (float) $p);
        $inStock = $variants->contains(fn ($v) => (int) $v->stock > 0);

        // "Was" price for a strikethrough: only when a variant is genuinely discounted.
        $compareAts = $variants->pluck('compare_at_price')->filter()->map(fn ($p) => (float) $p);
        $compareFrom = null;
        if ($compareAts->isNotEmpty() && $prices->isNotEmpty() && $compareAts->max() > $prices->min()) {
            $compareFrom = number_format($compareAts->max(), 2, '.', '');
        }

        $colors = $variants
            ->filter(fn ($v) => filled($v->color))
            ->unique(fn ($v) => mb_strtolower((string) $v->color).'|'.(string) $v->color_hex)
            ->values()
            ->map(fn ($v) => [
                'name' => (string) $v->color,
                'hex' => $v->color_hex,
            ]);

        $primary = null;
        $secondary = null;
        if ($this->relationLoaded('images')) {
            $sorted = $this->images->sortBy('position')->values();
            $primary = $sorted->firstWhere('is_primary', true) ?? $sorted->first();
            $secondary = $sorted->first(fn ($img) => $primary === null || $img->id !== $primary->id);
        }

        $brand = $this->whenLoaded('brand', function () use ($locale) {
            if ($this->brand === null) {
                return null;
            }

            return [
                'slug' => $this->brand->slugForLocale($locale),
                'name' => $this->brand->nameForLocale($locale),
            ];
        });

        $category = $this->whenLoaded('category', function () use ($locale) {
            if ($this->category === null) {
                return null;
            }

            return [
                'slug' => $this->category->slugForLocale($locale),
                'name' => $this->category->nameForLocale($locale),
            ];
        });

        return [
            'id' => $this->id,
            'slug' => $this->slugForLocale($locale),
            'title' => $this->titleForLocale($locale),
            'brand' => $brand,
            'category' => $category,
            'primary_image_url' => MediaUrl::fromPath($primary?->path),
            'secondary_image_url' => MediaUrl::fromPath($secondary?->path),
            'price_from' => $prices->isEmpty() ? null : number_format($prices->min(), 2, '.', ''),
            'price_to' => $prices->isEmpty() ? null : number_format($prices->max(), 2, '.', ''),
            'compare_at_from' => $compareFrom,
            'currency' => 'EUR',
            'in_stock' => $inStock,
            'colors' => $colors,
        ];
    }
}
