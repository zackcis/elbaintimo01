<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Product;
use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Product
 */
class ProductDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = (string) ($request->attributes->get('storefront_locale') ?? app('storefront.locale'));

        $categoryPath = [];
        if ($this->relationLoaded('category') && $this->category) {
            $walk = $this->category;
            $crumbs = [];
            while ($walk !== null) {
                if (! $walk->relationLoaded('translations')) {
                    $walk->load('translations');
                }
                array_unshift($crumbs, $walk->nameForLocale($locale));
                $walk = $walk->parent_id
                    ? ($walk->relationLoaded('parent') ? $walk->parent : $walk->parent()->with('translations')->first())
                    : null;
            }
            $categoryPath = $crumbs;
        }

        return [
            'id' => $this->id,
            'slug' => $this->slugForLocale($locale),
            'title' => $this->titleForLocale($locale),
            'description' => $this->descriptionForLocale($locale),
            'fabric' => $this->tissu,
            'care_notes' => $this->careNotesForLocale($locale),
            'fit_notes' => $this->fitNotesForLocale($locale),
            'complete_the_look' => $this->whenLoaded('relatedProducts', function () {
                return ProductCardResource::collection(
                    $this->relatedProducts->filter(fn (Product $p) => (bool) $p->is_published)->values()
                );
            }),
            'related' => $this->when(
                $this->relationLoaded('sameCategoryRelated'),
                fn () => ProductCardResource::collection($this->sameCategoryRelated)
            ),
            'brand' => $this->whenLoaded('brand', function () use ($locale) {
                if ($this->brand === null) {
                    return null;
                }

                return [
                    'slug' => $this->brand->slugForLocale($locale),
                    'name' => $this->brand->nameForLocale($locale),
                    'logo_url' => MediaUrl::fromPath($this->brand->logo),
                ];
            }),
            'category' => $this->whenLoaded('category', function () use ($locale, $categoryPath) {
                if ($this->category === null) {
                    return null;
                }

                return [
                    'slug' => $this->category->slugForLocale($locale),
                    'name' => $this->category->nameForLocale($locale),
                    'path' => $categoryPath,
                ];
            }),
            'images' => $this->whenLoaded('images', function () {
                return $this->images
                    ->sortBy('position')
                    ->values()
                    ->map(fn ($image) => [
                        'url' => MediaUrl::fromPath($image->path),
                        'is_primary' => (bool) $image->is_primary,
                        'position' => (int) $image->position,
                    ]);
            }),
            'variants' => $this->whenLoaded('variants', function () {
                return $this->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'sku' => null,
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'color_hex' => $variant->color_hex,
                    'price' => number_format((float) $variant->price, 2, '.', ''),
                    'compare_at_price' => $variant->compare_at_price !== null
                        ? number_format((float) $variant->compare_at_price, 2, '.', '')
                        : null,
                    'currency' => 'EUR',
                    'stock' => (int) $variant->stock,
                    'in_stock' => (int) $variant->stock > 0,
                ])->values();
            }),
        ];
    }
}
