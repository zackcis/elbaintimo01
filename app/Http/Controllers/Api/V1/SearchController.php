<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProductCardResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Support\MediaUrl;
use App\Support\StorefrontLocale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    private const AUDIENCES = ['women', 'men', 'kids'];

    public function __invoke(Request $request): JsonResponse
    {
        $locale = (string) $request->attributes->get('storefront_locale');
        $fallback = StorefrontLocale::fallback();

        $validated = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:255'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:24'],
        ]);

        $q = trim($validated['q']);
        $limit = (int) ($validated['limit'] ?? 12);
        $term = '%'.$q.'%';

        $categories = Category::query()
            ->with(['translations', 'images', 'parent.translations', 'parent.parent.translations', 'parent.parent.parent.translations'])
            ->whereHas('translations', function ($query) use ($term, $locale, $fallback) {
                $query->where(function ($inner) use ($term, $locale, $fallback) {
                    $inner->where('locale', $locale)->where(function ($nameOrSlug) use ($term) {
                        $nameOrSlug->where('name', 'like', $term)->orWhere('slug', 'like', $term);
                    });
                    if ($locale !== $fallback) {
                        $inner->orWhere(function ($or) use ($term, $fallback) {
                            $or->where('locale', $fallback)->where(function ($nameOrSlug) use ($term) {
                                $nameOrSlug->where('name', 'like', $term)->orWhere('slug', 'like', $term);
                            });
                        });
                    }
                });
            })
            ->limit($limit)
            ->get()
            ->map(function (Category $category) use ($locale) {
                $audience = $this->audienceForCategory($category);
                $image = $category->images->first();

                return [
                    'id' => $category->id,
                    'slug' => $category->slugForLocale($locale),
                    'name' => $category->nameForLocale($locale),
                    'audience' => $audience,
                    'image_url' => MediaUrl::fromPath($image?->path),
                ];
            })
            ->filter(fn (array $row) => $row['audience'] !== null)
            ->values()
            ->all();

        $brands = Brand::query()
            ->with('translations')
            ->whereHas('translations', function ($query) use ($term, $locale, $fallback) {
                $query->where(function ($inner) use ($term, $locale, $fallback) {
                    $inner->where('locale', $locale)->where(function ($nameOrSlug) use ($term) {
                        $nameOrSlug->where('name', 'like', $term)->orWhere('slug', 'like', $term);
                    });
                    if ($locale !== $fallback) {
                        $inner->orWhere(function ($or) use ($term, $fallback) {
                            $or->where('locale', $fallback)->where(function ($nameOrSlug) use ($term) {
                                $nameOrSlug->where('name', 'like', $term)->orWhere('slug', 'like', $term);
                            });
                        });
                    }
                });
            })
            ->limit($limit)
            ->get()
            ->map(fn (Brand $brand) => [
                'id' => $brand->id,
                'slug' => $brand->slugForLocale($locale),
                'name' => $brand->nameForLocale($locale),
                'logo_url' => MediaUrl::fromPath($brand->logo),
            ])
            ->values()
            ->all();

        $products = Product::query()
            ->published()
            ->with([
                'translations',
                'category.translations',
                'category.parent.translations',
                'category.parent.parent.translations',
                'category.parent.parent.parent.translations',
                'brand.translations',
                'variants',
                'images',
            ])
            ->where(function ($query) use ($term, $locale, $fallback) {
                $query->whereHas('translations', function ($q) use ($term, $locale, $fallback) {
                    $q->where(function ($inner) use ($term, $locale, $fallback) {
                        $inner->where('locale', $locale)->where('title', 'like', $term);
                        if ($locale !== $fallback) {
                            $inner->orWhere(function ($or) use ($term, $fallback) {
                                $or->where('locale', $fallback)->where('title', 'like', $term);
                            });
                        }
                    });
                })->orWhereHas('brand.translations', function ($q) use ($term, $locale, $fallback) {
                    $q->where(function ($inner) use ($term, $locale, $fallback) {
                        $inner->where('locale', $locale)->where('name', 'like', $term);
                        if ($locale !== $fallback) {
                            $inner->orWhere(function ($or) use ($term, $fallback) {
                                $or->where('locale', $fallback)->where('name', 'like', $term);
                            });
                        }
                    });
                })->orWhereHas('category.translations', function ($q) use ($term, $locale, $fallback) {
                    $q->where(function ($inner) use ($term, $locale, $fallback) {
                        $inner->where('locale', $locale)->where('name', 'like', $term);
                        if ($locale !== $fallback) {
                            $inner->orWhere(function ($or) use ($term, $fallback) {
                                $or->where('locale', $fallback)->where('name', 'like', $term);
                            });
                        }
                    });
                });
            })
            ->latest('id')
            ->limit($limit)
            ->get();

        $productPayload = $products->map(function (Product $product) use ($request) {
            $card = (new ProductCardResource($product))->toArray($request);
            $card['audience'] = $product->category
                ? $this->audienceForCategory($product->category)
                : null;

            return $card;
        })->values()->all();

        return response()->json([
            'data' => [
                'categories' => $categories,
                'brands' => $brands,
                'products' => $productPayload,
            ],
            'meta' => [
                'locale' => $locale,
                'q' => $q,
            ],
        ]);
    }

    private function audienceForCategory(Category $category): ?string
    {
        $node = $category;
        $guard = 0;

        while ($node !== null && $guard < 12) {
            $guard++;
            if (! $node->relationLoaded('translations')) {
                $node->load('translations');
            }

            foreach ($node->translations as $translation) {
                $slug = (string) $translation->slug;
                if (in_array($slug, self::AUDIENCES, true)) {
                    return $slug;
                }
            }

            if (! $node->relationLoaded('parent')) {
                $node->load('parent.translations');
            }

            $node = $node->parent;
        }

        return null;
    }
}
