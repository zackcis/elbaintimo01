<?php

namespace App\Services;

use App\Models\Category;
use App\Models\MerchandisingSection;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class MerchandisingSectionResolver
{
    /**
     * @return Collection<int, Product>
     */
    public function resolve(MerchandisingSection $section): Collection
    {
        $max = max(1, (int) $section->max_items);
        $rules = is_array($section->rules) ? $section->rules : [];

        $pins = $section->relationLoaded('pins')
            ? $section->pins
            : $section->pins()->orderBy('position')->orderBy('id')->get();

        $includePins = $pins
            ->filter(fn ($pin) => $pin->mode === 'include')
            ->sortBy([['position', 'asc'], ['id', 'asc']])
            ->values();

        $excludeIds = $pins
            ->filter(fn ($pin) => $pin->mode === 'exclude')
            ->pluck('product_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $includeIds = $includePins
            ->pluck('product_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $includeProducts = $this->loadPublishedProducts($includeIds)
            ->keyBy('id');

        $ordered = collect();
        foreach ($includeIds as $productId) {
            if (in_array($productId, $excludeIds, true)) {
                continue;
            }
            $product = $includeProducts->get($productId);
            if ($product !== null) {
                $ordered->push($product);
            }
        }

        if ($ordered->count() >= $max) {
            return $ordered->take($max)->values();
        }

        if (! $this->hasActiveRules($rules)) {
            return $ordered->values();
        }

        $already = $ordered->pluck('id')->all();
        $needed = $max - $ordered->count();

        $ruleMatches = $this->ruleQuery($rules)
            ->when($excludeIds !== [], fn (Builder $q) => $q->whereNotIn('id', $excludeIds))
            ->when($already !== [], fn (Builder $q) => $q->whereNotIn('id', $already))
            ->with([
                'translations',
                'category.translations',
                'brand.translations',
                'variants',
                'images',
            ])
            ->latest('id')
            ->limit($needed)
            ->get();

        return $ordered->concat($ruleMatches)->take($max)->values();
    }

    /**
     * @param  list<int>  $ids
     * @return Collection<int, Product>
     */
    private function loadPublishedProducts(array $ids): Collection
    {
        if ($ids === []) {
            return collect();
        }

        return Product::query()
            ->published()
            ->whereIn('id', $ids)
            ->with([
                'translations',
                'category.translations',
                'brand.translations',
                'variants',
                'images',
            ])
            ->get();
    }

    /**
     * @param  array<string, mixed>  $rules
     */
    private function hasActiveRules(array $rules): bool
    {
        $brandIds = array_filter(array_map('intval', $rules['brand_ids'] ?? []));
        $categoryIds = array_filter(array_map('intval', $rules['category_ids'] ?? []));
        $onSale = array_key_exists('on_sale', $rules) && $rules['on_sale'] !== null && $rules['on_sale'] !== '';
        $inStock = array_key_exists('in_stock', $rules) && $rules['in_stock'] !== null && $rules['in_stock'] !== '';

        return $brandIds !== [] || $categoryIds !== [] || $onSale || $inStock;
    }

    /**
     * @param  array<string, mixed>  $rules
     */
    private function ruleQuery(array $rules): Builder
    {
        $query = Product::query()->published();

        $brandIds = array_values(array_unique(array_filter(array_map('intval', $rules['brand_ids'] ?? []))));
        if ($brandIds !== []) {
            $query->whereIn('brand_id', $brandIds);
        }

        $categoryIds = array_values(array_unique(array_filter(array_map('intval', $rules['category_ids'] ?? []))));
        if ($categoryIds !== []) {
            $expanded = [];
            foreach ($categoryIds as $categoryId) {
                $expanded[] = $categoryId;
                $expanded = array_merge($expanded, Category::descendantIds($categoryId));
            }
            $query->whereIn('category_id', array_values(array_unique($expanded)));
        }

        if (! empty($rules['on_sale'])) {
            $query->whereHas('variants', function (Builder $q): void {
                $q->whereNotNull('compare_at_price')
                    ->whereColumn('compare_at_price', '>', 'price');
            });
        }

        if (array_key_exists('in_stock', $rules) && $rules['in_stock'] !== null && $rules['in_stock'] !== '') {
            if ($rules['in_stock']) {
                $query->whereHas('variants', fn (Builder $q) => $q->where('stock', '>', 0));
            } else {
                $query->whereDoesntHave('variants', fn (Builder $q) => $q->where('stock', '>', 0));
            }
        }

        return $query;
    }
}
