<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\BrandResource;
use App\Models\Brand;
use App\Support\MediaUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BrandController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $locale = (string) $request->attributes->get('storefront_locale');

        $brands = Brand::query()
            ->with('translations')
            ->withCount(['products' => fn ($q) => $q->published()])
            ->get()
            ->sortBy(fn (Brand $b) => $b->nameForLocale($locale), SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return BrandResource::collection($brands)->additional([
            'meta' => ['locale' => $locale],
        ]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $locale = (string) $request->attributes->get('storefront_locale');

        $brand = Brand::query()
            ->with('translations')
            ->withCount(['products' => fn ($q) => $q->published()])
            ->whereStorefrontSlug($slug, $locale)
            ->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $brand->id,
                'slug' => $brand->slugForLocale($locale),
                'name' => $brand->nameForLocale($locale),
                'logo_url' => MediaUrl::fromPath($brand->logo),
                'hero_url' => MediaUrl::fromPath($brand->hero_path),
                'products_count' => (int) $brand->products_count,
            ],
            'meta' => [
                'locale' => $locale,
            ],
        ]);
    }
}
