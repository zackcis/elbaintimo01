<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProductCardResource;
use App\Http\Resources\Api\V1\ProductDetailResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\StorefrontLocale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $locale = (string) $request->attributes->get('storefront_locale');
        $fallback = StorefrontLocale::fallback();

        $validated = $request->validate([
            'category' => ['nullable', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:255'],
            'size' => ['nullable', 'string', 'max:255'],
            'in_stock' => ['nullable', 'boolean'],
            'q' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'in:newest,price_asc,price_desc'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);

        $query = $this->baseFilteredQuery($validated, $locale, $fallback, $request->boolean('in_stock'));

        $sort = $validated['sort'] ?? 'newest';
        match ($sort) {
            'price_asc' => $query
                ->withMin('variants', 'price')
                ->orderBy('variants_min_price')
                ->orderByDesc('products.id'),
            'price_desc' => $query
                ->withMax('variants', 'price')
                ->orderByDesc('variants_max_price')
                ->orderByDesc('products.id'),
            default => $query->latest('products.id'),
        };

        $perPage = (int) ($validated['per_page'] ?? 24);
        $products = $query->paginate($perPage)->withQueryString();

        return ProductCardResource::collection($products)->additional([
            'meta' => [
                'locale' => $locale,
                'sort' => $sort,
                'facets' => $this->buildFacets($validated, $locale, $fallback, $request->boolean('in_stock')),
            ],
        ]);
    }

    public function show(Request $request, string $slug): ProductDetailResource
    {
        $locale = (string) $request->attributes->get('storefront_locale');

        $product = Product::query()
            ->published()
            ->with([
                'translations',
                'category.translations',
                'category.parent.translations',
                'brand.translations',
                'variants',
                'images',
                'relatedProducts' => fn ($q) => $q->published()->with([
                    'translations',
                    'category.translations',
                    'brand.translations',
                    'variants',
                    'images',
                ]),
            ])
            ->whereStorefrontSlug($slug, $locale)
            ->firstOrFail();

        $lookIds = $product->relatedProducts->pluck('id')->all();

        $related = Product::query()
            ->published()
            ->when(
                $product->brand_id,
                fn ($q) => $q->where('brand_id', $product->brand_id),
                fn ($q) => $q->where('category_id', $product->category_id),
            )
            ->where('id', '!=', $product->id)
            ->when($lookIds !== [], fn ($q) => $q->whereNotIn('id', $lookIds))
            ->with([
                'translations',
                'category.translations',
                'brand.translations',
                'variants',
                'images',
            ])
            ->latest('id')
            ->limit(8)
            ->get();

        $product->setRelation('sameCategoryRelated', $related);

        return (new ProductDetailResource($product))->additional([
            'meta' => ['locale' => $locale],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function baseFilteredQuery(
        array $validated,
        string $locale,
        string $fallback,
        bool $inStock,
        bool $applyBrand = true,
        bool $applyColor = true,
        bool $applySize = true,
        bool $applyCategory = true,
    ): Builder {
        $query = Product::query()
            ->published()
            ->with([
                'translations',
                'category.translations',
                'brand.translations',
                'variants',
                'images',
            ]);

        if ($applyCategory && ! empty($validated['category'])) {
            $category = Category::query()
                ->whereStorefrontSlug($validated['category'], $locale)
                ->first();

            if ($category) {
                $ids = array_merge([$category->id], Category::descendantIds($category->id));
                $query->whereIn('category_id', $ids);
            } else {
                $query->whereRaw('0 = 1');
            }
        }

        if ($applyBrand && ! empty($validated['brand'])) {
            $brand = Brand::query()
                ->whereStorefrontSlug($validated['brand'], $locale)
                ->first();

            if ($brand) {
                $query->where('brand_id', $brand->id);
            } else {
                $query->whereRaw('0 = 1');
            }
        }

        if ($applyColor && ! empty($validated['color'])) {
            $color = $validated['color'];
            $query->whereHas('variants', fn ($q) => $q->where('color', $color));
        }

        if ($applySize && ! empty($validated['size'])) {
            $size = $validated['size'];
            $query->whereHas('variants', fn ($q) => $q->where('size', $size));
        }

        if ($inStock) {
            $query->whereHas('variants', fn ($q) => $q->where('stock', '>', 0));
        }

        if (! empty($validated['q'])) {
            $term = '%'.$validated['q'].'%';
            $query->whereHas('translations', function ($q) use ($term, $locale, $fallback) {
                $q->where(function ($inner) use ($term, $locale, $fallback) {
                    $inner->where('locale', $locale)->where('title', 'like', $term);
                    if ($locale !== $fallback) {
                        $inner->orWhere(function ($or) use ($term, $fallback) {
                            $or->where('locale', $fallback)->where('title', 'like', $term);
                        });
                    }
                });
            });
        }

        return $query;
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{
     *     sizes: list<string>,
     *     colors: list<array{name: string, hex: string|null}>,
     *     brands: list<array{slug: string, name: string}>,
     *     categories: list<array{slug: string, count: int}>
     * }
     */
    private function buildFacets(array $validated, string $locale, string $fallback, bool $inStock): array
    {
        $sizeQuery = $this->baseFilteredQuery($validated, $locale, $fallback, $inStock, applySize: false);
        $colorQuery = $this->baseFilteredQuery($validated, $locale, $fallback, $inStock, applyColor: false);
        $brandQuery = $this->baseFilteredQuery($validated, $locale, $fallback, $inStock, applyBrand: false);
        $categoryQuery = $this->baseFilteredQuery($validated, $locale, $fallback, $inStock, applyCategory: false);

        $sizeProductIds = (clone $sizeQuery)->select('products.id')->pluck('id');
        $colorProductIds = (clone $colorQuery)->select('products.id')->pluck('id');
        $brandProductIds = (clone $brandQuery)->select('products.id')->pluck('id');

        $sizes = ProductVariant::query()
            ->whereIn('product_id', $sizeProductIds)
            ->when($inStock, fn ($q) => $q->where('stock', '>', 0))
            ->whereNotNull('size')
            ->where('size', '!=', '')
            ->distinct()
            ->orderBy('size')
            ->pluck('size')
            ->values()
            ->all();

        $colorRows = ProductVariant::query()
            ->whereIn('product_id', $colorProductIds)
            ->when($inStock, fn ($q) => $q->where('stock', '>', 0))
            ->whereNotNull('color')
            ->where('color', '!=', '')
            ->get(['color', 'color_hex']);

        $colors = $colorRows
            ->unique(fn ($v) => mb_strtolower((string) $v->color))
            ->map(fn ($v) => [
                'name' => (string) $v->color,
                'hex' => $v->color_hex,
            ])
            ->values()
            ->all();

        $brands = Brand::query()
            ->whereIn('id', Product::query()->whereIn('id', $brandProductIds)->pluck('brand_id')->filter())
            ->with('translations')
            ->get()
            ->map(fn (Brand $brand) => [
                'slug' => $brand->slugForLocale($locale),
                'name' => $brand->nameForLocale($locale),
            ])
            ->sortBy('name')
            ->values()
            ->all();

        $categories = $this->buildCategoryCounts($categoryQuery, $locale);

        return [
            'sizes' => $sizes,
            'colors' => $colors,
            'brands' => $brands,
            'categories' => $categories,
        ];
    }

    /**
     * Roll product counts up the category tree so L2 slugs include L3 products.
     *
     * @return list<array{slug: string, count: int}>
     */
    private function buildCategoryCounts(Builder $categoryQuery, string $locale): array
    {
        $productIds = (clone $categoryQuery)->select('products.id')->pluck('id');

        if ($productIds->isEmpty()) {
            return [];
        }

        $byCategoryId = Product::query()
            ->whereIn('id', $productIds)
            ->whereNotNull('category_id')
            ->selectRaw('category_id, count(*) as aggregate')
            ->groupBy('category_id')
            ->pluck('aggregate', 'category_id');

        if ($byCategoryId->isEmpty()) {
            return [];
        }

        $all = Category::query()
            ->with('translations')
            ->get(['id', 'parent_id'])
            ->keyBy('id');

        /** @var array<string, int> $bySlug */
        $bySlug = [];

        foreach ($byCategoryId as $categoryId => $count) {
            $n = (int) $count;
            $id = (int) $categoryId;

            while ($id > 0 && $all->has($id)) {
                /** @var Category $node */
                $node = $all->get($id);
                $slug = $node->slugForLocale($locale);
                if ($slug !== '') {
                    $bySlug[$slug] = ($bySlug[$slug] ?? 0) + $n;
                }
                $id = (int) ($node->parent_id ?? 0);
            }
        }

        return collect($bySlug)
            ->map(fn (int $count, string $slug) => [
                'slug' => $slug,
                'count' => $count,
            ])
            ->values()
            ->all();
    }
}
