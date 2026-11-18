<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MerchandisingShelf;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProductCardResource;
use App\Models\MerchandisingSection;
use App\Services\MerchandisingSectionResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MerchandisingController extends Controller
{
    /** @var list<string> */
    private const AUDIENCES = ['women', 'men', 'kids'];

    public function __construct(
        private readonly MerchandisingSectionResolver $resolver,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $locale = (string) $request->attributes->get('storefront_locale');
        $audience = $this->requireAudience($request);
        $payload = [];
        $metaSections = [];

        foreach (MerchandisingShelf::values() as $slug) {
            $section = $this->sectionForSlug($slug, $audience);
            $products = $section && $section->is_active
                ? $this->resolver->resolve($section)
                : collect();

            $payload[$slug] = ProductCardResource::collection($products)->toArray($request);
            $metaSections[$slug] = [
                'title' => $section?->titleForLocale($locale),
                'audience' => $section?->audience,
                'max_items' => $section?->max_items,
                'is_active' => (bool) ($section?->is_active ?? false),
            ];
        }

        return response()->json([
            'data' => $payload,
            'meta' => [
                'locale' => $locale,
                'audience' => $audience,
                'sections' => $metaSections,
            ],
        ]);
    }

    public function show(Request $request, string $shelf): JsonResponse
    {
        $locale = (string) $request->attributes->get('storefront_locale');
        $audience = $this->requireAudience($request);

        $request->merge(['shelf' => $shelf]);
        $request->validate([
            'shelf' => ['required', Rule::in(MerchandisingShelf::values())],
        ]);

        $section = $this->sectionForSlug($shelf, $audience);
        $products = $section && $section->is_active
            ? $this->resolver->resolve($section)
            : collect();

        return response()->json([
            'data' => ProductCardResource::collection($products)->toArray($request),
            'meta' => [
                'locale' => $locale,
                'audience' => $audience,
                'shelf' => $shelf,
                'title' => $section?->titleForLocale($locale),
            ],
        ]);
    }

    private function requireAudience(Request $request): string
    {
        $validated = $request->validate([
            'audience' => ['required', Rule::in(self::AUDIENCES)],
        ]);

        return $validated['audience'];
    }

    private function sectionForSlug(string $slug, string $audience): ?MerchandisingSection
    {
        return MerchandisingSection::query()
            ->where('slug', $slug)
            ->where('audience', $audience)
            ->with([
                'pins' => fn ($q) => $q->orderBy('position')->orderBy('id'),
            ])
            ->first();
    }
}
