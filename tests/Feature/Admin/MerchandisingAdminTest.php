<?php

namespace Tests\Feature\Admin;

use App\Enums\MerchandisingShelf;
use App\Models\Brand;
use App\Models\Category;
use App\Models\MerchandisingPin;
use App\Models\MerchandisingSection;
use App\Models\Product;
use App\Models\User;
use App\Support\UniqueSlug;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MerchandisingAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_view_merchandising_page(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)
            ->get(route('merchandising.index', ['audience' => 'women']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('merchandising/index')
                ->where('audience', 'women')
                ->has('sections', 4)
            );
    }

    public function test_ensure_creates_twelve_sections(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)->get(route('merchandising.index'));

        $this->assertSame(
            12,
            MerchandisingSection::query()->count()
        );
        $this->assertSame(
            4,
            MerchandisingSection::query()->where('audience', 'women')->count()
        );
        $this->assertSame(
            4,
            MerchandisingSection::query()->where('audience', 'men')->count()
        );
        $this->assertSame(
            4,
            MerchandisingSection::query()->where('audience', 'kids')->count()
        );
    }

    public function test_staff_can_update_sections_with_published_products_only(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $published = $this->makeProduct(true, 'Pub');
        $draft = $this->makeProduct(false, 'Draft');

        $this->actingAs($staff)
            ->put(route('merchandising.update'), [
                'audience' => 'women',
                'sections' => $this->sectionPayload([
                    MerchandisingShelf::BestSellers->value => [
                        ['product_id' => $published->id, 'mode' => 'include'],
                    ],
                ]),
            ])
            ->assertRedirect(route('merchandising.index', ['audience' => 'women']));

        $section = MerchandisingSection::query()
            ->where('slug', MerchandisingShelf::BestSellers->value)
            ->where('audience', 'women')
            ->firstOrFail();

        $this->assertDatabaseHas('merchandising_pins', [
            'section_id' => $section->id,
            'product_id' => $published->id,
            'position' => 0,
            'mode' => 'include',
        ]);

        $this->actingAs($staff)
            ->from(route('merchandising.index', ['audience' => 'women']))
            ->put(route('merchandising.update'), [
                'audience' => 'women',
                'sections' => $this->sectionPayload([
                    MerchandisingShelf::BestSellers->value => [
                        ['product_id' => $draft->id, 'mode' => 'include'],
                    ],
                ]),
            ])
            ->assertRedirect(route('merchandising.index', ['audience' => 'women']))
            ->assertSessionHasNoErrors();

        // Draft pins are dropped instead of blocking the whole save.
        $this->assertDatabaseMissing('merchandising_pins', [
            'product_id' => $draft->id,
        ]);
    }

    public function test_saving_women_shelves_does_not_change_men_shelves(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $menSection = MerchandisingSection::query()
            ->where('slug', MerchandisingShelf::BestSellers->value)
            ->where('audience', 'men')
            ->firstOrFail();
        $menSection->update([
            'title_it' => 'Uomo Best',
            'title_en' => 'Men Best',
            'max_items' => 7,
        ]);

        $payload = $this->sectionPayload([]);
        foreach ($payload as &$section) {
            if ($section['slug'] === MerchandisingShelf::BestSellers->value) {
                $section['title_it'] = 'Donna Best';
                $section['title_en'] = 'Women Best';
                $section['max_items'] = 10;
            }
        }
        unset($section);

        $this->actingAs($staff)
            ->put(route('merchandising.update'), [
                'audience' => 'women',
                'sections' => $payload,
            ])
            ->assertRedirect(route('merchandising.index', ['audience' => 'women']));

        $this->assertDatabaseHas('merchandising_sections', [
            'slug' => MerchandisingShelf::BestSellers->value,
            'audience' => 'women',
            'title_it' => 'Donna Best',
            'title_en' => 'Women Best',
            'max_items' => 10,
        ]);

        $this->assertDatabaseHas('merchandising_sections', [
            'slug' => MerchandisingShelf::BestSellers->value,
            'audience' => 'men',
            'title_it' => 'Uomo Best',
            'title_en' => 'Men Best',
            'max_items' => 7,
        ]);
    }

    public function test_staff_can_update_section_titles(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $payload = $this->sectionPayload([]);
        foreach ($payload as &$section) {
            if ($section['slug'] === MerchandisingShelf::BestSellers->value) {
                $section['title_it'] = 'Novità della ana';
                $section['title_en'] = 'News of the week';
                $section['max_items'] = 10;
                $section['rules'] = [
                    'brand_ids' => [],
                    'category_ids' => [],
                    'on_sale' => true,
                    'in_stock' => true,
                ];
            }
        }
        unset($section);

        $this->actingAs($staff)
            ->put(route('merchandising.update'), [
                'audience' => 'men',
                'sections' => $payload,
            ])
            ->assertRedirect(route('merchandising.index', ['audience' => 'men']))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('merchandising_sections', [
            'slug' => MerchandisingShelf::BestSellers->value,
            'audience' => 'men',
            'title_it' => 'Novità della ana',
            'title_en' => 'News of the week',
            'max_items' => 10,
        ]);
    }

    public function test_unpublishing_product_removes_it_from_pins(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $product = $this->makeProduct(true, 'Shelf Item');

        $section = MerchandisingSection::query()->firstOrCreate(
            [
                'slug' => MerchandisingShelf::Featured->value,
                'audience' => 'women',
            ],
            [
                'title_it' => 'In evidenza',
                'title_en' => 'Featured',
                'max_items' => 12,
                'is_active' => true,
            ],
        );

        MerchandisingPin::create([
            'section_id' => $section->id,
            'product_id' => $product->id,
            'position' => 0,
            'mode' => 'include',
        ]);

        $payload = [
            'title' => ['it' => 'Shelf Item', 'en' => 'Shelf Item'],
            'description' => ['it' => null, 'en' => null],
            'category_id' => $product->category_id,
            'brand_id' => $product->brand_id,
            'tissu' => null,
            'is_published' => '0',
            'variants' => [
                [
                    'size' => 'M',
                    'color_it' => 'Nero',
                    'color_en' => 'Black',
                    'color_hex' => '#000000',
                    'price' => 10,
                    'stock' => 1,
                ],
            ],
        ];

        $this->actingAs($staff)
            ->put(route('products.update', $product), $payload)
            ->assertRedirect();

        $this->assertDatabaseMissing('merchandising_pins', [
            'product_id' => $product->id,
        ]);
        $this->assertFalse($product->fresh()->is_published);
    }

    /**
     * @param  array<string, list<array{product_id: int, mode: string}>>  $pinsBySlug
     * @return list<array<string, mixed>>
     */
    private function sectionPayload(array $pinsBySlug): array
    {
        $sections = [];
        foreach (MerchandisingShelf::values() as $slug) {
            $sections[] = [
                'slug' => $slug,
                'title_it' => $slug,
                'title_en' => $slug,
                'max_items' => 12,
                'is_active' => true,
                'rules' => [
                    'brand_ids' => [],
                    'category_ids' => [],
                    'on_sale' => false,
                    'in_stock' => null,
                ],
                'pins' => $pinsBySlug[$slug] ?? [],
            ];
        }

        return $sections;
    }

    private function makeProduct(bool $published, string $title): Product
    {
        $category = Category::create(['parent_id' => null]);
        foreach (['it', 'en'] as $loc) {
            $category->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('cat-'.$title, 'category_translations', $loc),
                'name' => 'Cat '.$title,
            ]);
        }

        $brand = Brand::create(['logo' => null]);
        foreach (['it', 'en'] as $loc) {
            $brand->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('brand-'.$title, 'brand_translations', $loc),
                'name' => 'Brand '.$title,
            ]);
        }

        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'is_published' => $published,
            'published_at' => $published ? now() : null,
        ]);

        foreach (['it', 'en'] as $loc) {
            $product->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make($title, 'product_translations', $loc),
                'title' => $title,
                'description' => null,
            ]);
        }

        $product->variants()->create([
            'size' => 'M',
            'color' => 'Nero',
            'color_hex' => '#000000',
            'price' => 10,
            'stock' => 3,
        ]);

        return $product;
    }
}
