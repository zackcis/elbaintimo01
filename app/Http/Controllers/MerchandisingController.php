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

    public function index(): Response
    {
        $this->ensureSectionsExist();

        $order = array_flip(MerchandisingShelf::values());

        $sections = MerchandisingSection::query()
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
            ->with(['translations', 'images'])
            ->latest('id')
            ->get()
            ->map(function (Product $product) {
                $primary = $product->images->firstWhere('is_primary', true)
                    ?? $product->images->sortBy('position')->first();

                return [
                    'id' => $product->id,
                    'title' => $product->title,
                    'image_path' => $primary?->path,
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

        $categories = Category::parentSelectOptions();

        return Inertia::render('merchandising/index', [
            'sections' => $sections,
            'shelfKeys' => MerchandisingShelf::values(),
            'publishedProducts' => $publishedProducts,
            'brands' => $brands,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $this->ensureSectionsExist();

        $validated = $request->validate([
            'sections' => ['required', 'array'],
            'sections.*.slug' => ['required', 'string', Rule::in(MerchandisingShelf::values())],
            'sections.*.title_it' => ['required', 'string', 'max:255'],
            'sections.*.title_en' => ['required', 'string', 'max:255'],
            'sections.*.audience' => ['nullable', 'in:women,men,kids'],
            'sections.*.max_items' => ['required', 'integer', 'min:1', 'max:48'],
            'sections.*.is_active' => ['required', 'boolean'],
            'sections.*.rules' => ['nullable', 'array'],
            'sections.*.rules.brand_ids' => ['nullable', 'array'],
            'sections.*.rules.brand_ids.*' => ['integer', 'exists:brands,id'],
            'sections.*.rules.category_ids' => ['nullable', 'array'],
            'sections.*.rules.category_ids.*' => ['integer', 'exists:categories,id'],
            'sections.*.rules.on_sale' => ['nullable', 'boolean'],
            'sections.*.rules.in_stock' => ['nullable', 'boolean'],
            'sections.*.pins' => ['nullable', 'array'],
            'sections.*.pins.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'sections.*.pins.*.mode' => ['required', 'in:include,exclude'],
        ]);

        $incoming = collect($validated['sections'])->keyBy('slug');

        foreach (MerchandisingShelf::values() as $slug) {
            if (! $incoming->has($slug)) {
                return back()->withErrors([
                    'sections' => "Missing section payload for {$slug}.",
                ]);
            }
        }

        $allProductIds = [];
        foreach ($incoming as $sectionData) {
            foreach ($sectionData['pins'] ?? [] as $pin) {
                $allProductIds[] = (int) $pin['product_id'];
            }
        }

        if ($allProductIds !== []) {
            $unpublished = Product::query()
                ->whereIn('id', array_unique($allProductIds))
                ->where('is_published', false)
                ->pluck('id');

            if ($unpublished->isNotEmpty()) {
                return back()->withErrors([
                    'sections' => 'Only published products can be pinned to merchandising sections.',
                ]);
            }
        }

        DB::transaction(function () use ($incoming): void {
            foreach (MerchandisingShelf::values() as $slug) {
                /** @var array<string, mixed> $data */
                $data = $incoming->get($slug);
                $section = MerchandisingSection::query()->where('slug', $slug)->firstOrFail();

                $rules = [
                    'brand_ids' => array_values(array_unique(array_map(
                        'intval',
                        $data['rules']['brand_ids'] ?? []
                    ))),
                    'category_ids' => array_values(array_unique(array_map(
                        'intval',
                        $data['rules']['category_ids'] ?? []
                    ))),
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
                    'audience' => $data['audience'] ?: null,
                    'max_items' => (int) $data['max_items'],
                    'is_active' => (bool) $data['is_active'],
                    'rules' => $rules === [] ? null : $rules,
                ]);

                $section->pins()->delete();

                $seen = [];
                foreach (array_values($data['pins'] ?? []) as $position => $pin) {
                    $productId = (int) $pin['product_id'];
                    if (isset($seen[$productId])) {
                        continue;
                    }
                    $seen[$productId] = true;

                    MerchandisingPin::query()->create([
                        'section_id' => $section->id,
                        'product_id' => $productId,
                        'position' => $position,
                        'mode' => $pin['mode'],
                    ]);
                }
            }
        });

        $this->logActivity('updated', 'Merchandising', null, 'Merchandising sections updated');

        return redirect()->route('merchandising.index')
            ->with('success', 'Merchandising sections updated.');
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
            MerchandisingSection::query()->firstOrCreate(
                ['slug' => $slug],
                [
                    'title_it' => $titleIt,
                    'title_en' => $titleEn,
                    'audience' => null,
                    'max_items' => 12,
                    'rules' => null,
                    'is_active' => true,
                ],
            );
        }
    }
}
