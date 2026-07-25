<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\MediaUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locale = (string) $request->attributes->get('storefront_locale');

        $all = Category::query()
            ->with(['translations', 'images'])
            ->get();

        return response()->json([
            'data' => Category::storefrontTree($all, $locale, null),
            'meta' => [
                'locale' => $locale,
            ],
        ]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $locale = (string) $request->attributes->get('storefront_locale');

        $category = Category::query()
            ->with(['translations', 'images', 'parent.translations', 'children.translations', 'children.images'])
            ->whereStorefrontSlug($slug, $locale)
            ->firstOrFail();

        $image = $category->images->first();

        return response()->json([
            'data' => [
                'id' => $category->id,
                'slug' => $category->slugForLocale($locale),
                'name' => $category->nameForLocale($locale),
                'parent' => $category->parent ? [
                    'slug' => $category->parent->slugForLocale($locale),
                    'name' => $category->parent->nameForLocale($locale),
                ] : null,
                'image_url' => MediaUrl::fromPath($image?->path),
                'hero_url' => MediaUrl::fromPath($category->hero_path),
                'children' => $category->children
                    ->sortBy(fn (Category $c) => $c->nameForLocale($locale), SORT_NATURAL | SORT_FLAG_CASE)
                    ->values()
                    ->map(fn (Category $child) => [
                        'slug' => $child->slugForLocale($locale),
                        'name' => $child->nameForLocale($locale),
                        'image_url' => MediaUrl::fromPath($child->images->first()?->path),
                        'hero_url' => MediaUrl::fromPath($child->hero_path),
                    ]),
            ],
            'meta' => [
                'locale' => $locale,
            ],
        ]);
    }
}
