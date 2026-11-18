<?php

namespace App\Http\Controllers;

use App\Enums\MerchandisingShelf;
use App\Models\Brand;
use App\Models\Category;
use App\Models\MerchandisingPin;
use App\Models\MerchandisingSection;
use App\Models\Product;
use App\Traits\LogsActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MerchandisingController extends Controller
{
    use LogsActivity;

    /** @var list<string> */
    private const AUDIENCES = ['women', 'men', 'kids'];

    public function index(Request $request): Response
    {
        $this->ensureSectionsExist();

        $audience = $this->resolveAudience($request->query('audience'));
        $order = array_flip(MerchandisingShelf::values());
        $audienceCategoryIds = Category::idsForAudienceTree($audience);

        $sections = MerchandisingSection::query()
            ->where('audience', $audience)
            ->whereIn('slug', MerchandisingShelf::values())
            ->with([
                'pins' => fn ($q) => $q->orderBy('position')->orderBy('id'),
                'pins.product' => fn ($q) => $q->with(['translations', 'images']),
            ])
            ->get()
            ->sortBy(fn (MerchandisingSection $s) => $order[$s->slug] ?? 99)
            ->values()
            ->map(function (MerchandisingSection $section) {
                $pins = $section->pins->map(function (MerchandisingPin $pin) {
                    $product = $pin->product;
                    if ($product === null) {
                        return null;
                    }

                    $primary = $product->images->firstWhere('is_primary', true)
                        ?? $product->images->sortBy('position')->first();

                    return [
                        'product_id' => $product->id,
                        'title' => $product->title,
                        'is_published' => (bool) $product->is_published,
                        'image_path' => $primary?->path,
                        'position' => (int) $pin->position,
                        'mode' => $pin->mode,
                    ];
                })->filter()->values()->all();

                return [
                    'id' => $section->id,
                    'slug' => $section->slug,
                    'title_it' => $section->title_it,
                    'title_en' => $section->title_en,
                    'audience' => $section->audience,
                    'max_items' => (int) $section->max_items,
                    'is_active' => (bool) $section->is_active,
                    'rules' => [
                        'brand_ids' => array_values(array_map('intval', ($section->rules ?? [])['brand_ids'] ?? [])),
                        'category_ids' => array_values(array_map('intval', ($section->rules ?? [])['category_ids'] ?? [])),
                        'on_sale' => (bool) (($section->rules ?? [])['on_sale'] ?? false),
                        'in_stock' => array_key_exists('in_stock', $section->rules ?? [])
                            ? (bool) $section->rules['in_stock']
                            : null,
                    ],
                    'pins' => $pins,
                ];
            })
            ->values()
            ->all();

        $publishedProducts = Product::query()
            ->published()
            ->with(['translations', 'images', 'variants'])
            ->latest('id')
            ->get()
            ->map(function (Product $product) {
                $primary = $product->images->firstWhere('is_primary', true)
                    ?? $product->images->sortBy('position')->first();

                return [
                    'id' => $product->id,
                    'title' => $product->title,
                    'image_path' => $primary?->path,
                    'brand_id' => $product->brand_id ? (int) $product->brand_id : null,
                    'category_id' => $product->category_id ? (int) $product->category_id : null,
                    'in_stock' => $product->variants->contains(fn ($v) => (int) $v->stock > 0),
                    'on_sale' => $product->variants->contains(
                        fn ($v) => $v->compare_at_price !== null
                            && (float) $v->compare_at_price > (float) $v->price
                    ),
                ];
            })
            ->values()
            ->all();

        $brands = Brand::query()
            ->with('translations')
            ->adminOrderByName()
            ->get()
            ->map(fn (Brand $b) => [
                'id' => $b->id,
                'name' => $b->name,
            ])
            ->values()
            ->all();

        $audienceCategorySet = array_flip($audienceCategoryIds);
        $parentById = Category::query()->pluck('parent_id', 'id');
        $categories = array_values(array_filter(
            array_map(
                static function (array $opt) use ($parentById): array {
                    $id = (int) $opt['id'];

                    return [
                        'id' => $id,
                        'label' => $opt['label'] ?? '',
                        'parent_id' => isset($parentById[$id]) && $parentById[$id] !== null
                            ? (int) $parentById[$id]
                            : null,
                    ];
                },
                Category::parentSelectOptions()
            ),
            static fn (array $opt): bool => isset($audienceCategorySet[(int) $opt['id']])
        ));

        return Inertia::render('merchandising/index', [
            'sections' => $sections,
            'shelfKeys' => MerchandisingShelf::values(),
            'publishedProducts' => $publishedProducts,
            'brands' => $brands,
            'categories' => $categories,
            'audience' => $audience,
            'audienceCategoryIds' => $audienceCategoryIds,
            'audiences' => self::AUDIENCES,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->ensureSectionsExist();

        $request->merge([
            'sections' => $this->normalizeSectionsPayload($request->input('sections')),
        ]);

        $validated = $request->validate([
            'audience' => ['required', Rule::in(self::AUDIENCES)],
            'sections' => ['required', 'array'],
            'sections.*.slug' => ['required', 'string', Rule::in(MerchandisingShelf::values())],
            'sections.*.title_it' => ['required', 'string', 'max:255'],
            'sections.*.title_en' => ['required', 'string', 'max:255'],
            'sections.*.max_items' => ['required', 'integer', 'min:1', 'max:48'],
            'sections.*.is_active' => ['required', 'boolean'],
            'sections.*.rules' => ['nullable', 'array'],
            'sections.*.rules.brand_ids' => ['nullable', 'array'],
            'sections.*.rules.brand_ids.*' => ['integer'],
            'sections.*.rules.category_ids' => ['nullable', 'array'],
            'sections.*.rules.category_ids.*' => ['integer'],
            'sections.*.rules.on_sale' => ['nullable', 'boolean'],
            'sections.*.rules.in_stock' => ['nullable', 'boolean'],
            'sections.*.pins' => ['nullable', 'array'],
            'sections.*.pins.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'sections.*.pins.*.mode' => ['required', 'in:include,exclude'],
        ]);

        $audience = $validated['audience'];
        $incoming = collect($validated['sections'])->keyBy('slug');

        foreach (MerchandisingShelf::values() as $slug) {
            if (! $incoming->has($slug)) {
                return back()->withErrors([
                    'sections' => "Missing section payload for {$slug}.",
                ]);
            }
        }

        $validBrandIds = Brand::query()->pluck('id')->map(fn ($id) => (int) $id)->all();
        $validBrandSet = array_flip($validBrandIds);
        $validCategoryIds = Category::query()->pluck('id')->map(fn ($id) => (int) $id)->all();
        $validCategorySet = array_flip($validCategoryIds);

        $allProductIds = [];
        foreach ($incoming as $sectionData) {
            foreach ($sectionData['pins'] ?? [] as $pin) {
                $allProductIds[] = (int) $pin['product_id'];
            }
        }

        $publishedProductIds = $allProductIds === []
            ? []
            : Product::query()
                ->published()
                ->whereIn('id', array_unique($allProductIds))
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();
        $publishedSet = array_flip($publishedProductIds);

        DB::transaction(function () use ($incoming, $validBrandSet, $validCategorySet, $publishedSet, $audience): void {
            foreach (MerchandisingShelf::values() as $slug) {
                /** @var array<string, mixed> $data */
                $data = $incoming->get($slug);
                $section = MerchandisingSection::query()
                    ->where('slug', $slug)
                    ->where('audience', $audience)
                    ->firstOrFail();

                $brandIds = array_values(array_unique(array_filter(
                    array_map('intval', $data['rules']['brand_ids'] ?? []),
                    fn (int $id) => isset($validBrandSet[$id])
                )));
                $categoryIds = array_values(array_unique(array_filter(
                    array_map('intval', $data['rules']['category_ids'] ?? []),
                    fn (int $id) => isset($validCategorySet[$id])
                )));

                $rules = [
                    'brand_ids' => $brandIds,
                    'category_ids' => $categoryIds,
                    'on_sale' => (bool) ($data['rules']['on_sale'] ?? false),
                    'in_stock' => array_key_exists('in_stock', $data['rules'] ?? [])
                        && $data['rules']['in_stock'] !== null
                        ? (bool) $data['rules']['in_stock']
                        : null,
                ];

                if ($rules['in_stock'] === null) {
                    unset($rules['in_stock']);
                }
                if (! $rules['on_sale']) {
                    unset($rules['on_sale']);
                }
                if ($rules['brand_ids'] === []) {
                    unset($rules['brand_ids']);
                }
                if ($rules['category_ids'] === []) {
                    unset($rules['category_ids']);
                }

                $section->update([
                    'title_it' => $data['title_it'],
                    'title_en' => $data['title_en'],
                    'max_items' => (int) $data['max_items'],
                    'is_active' => (bool) $data['is_active'],
                    'rules' => $rules === [] ? null : $rules,
                ]);

                $section->pins()->delete();

                $seen = [];
                foreach (array_values($data['pins'] ?? []) as $position => $pin) {
                    $productId = (int) $pin['product_id'];
                    if (isset($seen[$productId]) || ! isset($publishedSet[$productId])) {
                        continue;
                    }
                    $seen[$productId] = true;

                    MerchandisingPin::query()->create([
                        'section_id' => $section->id,
                        'product_id' => $productId,
                        'position' => count($seen) - 1,
                        'mode' => $pin['mode'],
                    ]);
                }
            }
        });

        $this->logActivity('updated', 'Merchandising', null, 'Merchandising sections updated ('.$audience.')');

        return redirect()->route('merchandising.index', ['audience' => $audience])
            ->with('success', 'Merchandising sections updated.');
    }

    /**
     * Coerce Inertia/JSON payload types so boolean/integer rules don't fail silently.
     *
     * @param  mixed  $sections
     * @return list<array<string, mixed>>
     */
    private function normalizeSectionsPayload(mixed $sections): array
    {
        if (! is_array($sections)) {
            return [];
        }

        $normalized = [];
        foreach ($sections as $section) {
            if (! is_array($section)) {
                continue;
            }

            $rules = is_array($section['rules'] ?? null) ? $section['rules'] : [];
            $inStockRaw = $rules['in_stock'] ?? null;
            $inStock = ($inStockRaw === null || $inStockRaw === '')
                ? null
                : $this->asBool($inStockRaw);

            $pins = [];
            foreach (is_array($section['pins'] ?? null) ? $section['pins'] : [] as $pin) {
                if (! is_array($pin) || ! isset($pin['product_id'])) {
                    continue;
                }
                $mode = ($pin['mode'] ?? 'include') === 'exclude' ? 'exclude' : 'include';
                $pins[] = [
                    'product_id' => (int) $pin['product_id'],
                    'mode' => $mode,
                ];
            }

            $normalized[] = [
                'slug' => (string) ($section['slug'] ?? ''),
                'title_it' => trim((string) ($section['title_it'] ?? '')),
                'title_en' => trim((string) ($section['title_en'] ?? '')),
                'max_items' => max(1, min(48, (int) ($section['max_items'] ?? 12))),
                'is_active' => $this->asBool($section['is_active'] ?? true),
                'rules' => [
                    'brand_ids' => array_values(array_map(
                        'intval',
                        is_array($rules['brand_ids'] ?? null) ? $rules['brand_ids'] : []
                    )),
                    'category_ids' => array_values(array_map(
                        'intval',
                        is_array($rules['category_ids'] ?? null) ? $rules['category_ids'] : []
                    )),
                    'on_sale' => $this->asBool($rules['on_sale'] ?? false),
                    'in_stock' => $inStock,
                ],
                'pins' => $pins,
            ];
        }

        return $normalized;
    }

    private function asBool(mixed $value, bool $default = false): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return (bool) $value;
        }
        if (is_string($value)) {
            $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            return $parsed ?? $default;
        }

        return $default;
    }

    private function resolveAudience(mixed $raw): string
    {
        if (is_string($raw) && in_array($raw, self::AUDIENCES, true)) {
            return $raw;
        }

        return 'women';
    }

    private function ensureSectionsExist(): void
    {
        $defaults = [
            MerchandisingShelf::BestSellers->value => ['Best seller', 'Best sellers'],
            MerchandisingShelf::NewArrivals->value => ['Novità', 'New arrivals'],
            MerchandisingShelf::Featured->value => ['In evidenza', 'Featured'],
            MerchandisingShelf::SpecialOffers->value => ['Offerte speciali', 'Special offers'],
        ];

        foreach ($defaults as $slug => [$titleIt, $titleEn]) {
            foreach (self::AUDIENCES as $audience) {
                MerchandisingSection::query()->firstOrCreate(
                    ['slug' => $slug, 'audience' => $audience],
                    [
                        'title_it' => $titleIt,
                        'title_en' => $titleEn,
                        'max_items' => 12,
                        'rules' => null,
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
