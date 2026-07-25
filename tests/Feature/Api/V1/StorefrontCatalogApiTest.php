<?php

namespace Tests\Feature\Api\V1;

use App\Enums\MerchandisingShelf;
use App\Models\Brand;
use App\Models\Category;
use App\Models\MerchandisingPin;
use App\Models\MerchandisingSection;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\UniqueSlug;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StorefrontCatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('version', 'v1');
    }

    public function test_products_index_returns_only_published(): void
    {
        $this->seedCatalogProduct(published: true, title: 'Published Bra');
        $this->seedCatalogProduct(published: false, title: 'Draft Bra');

        $response = $this->getJson('/api/v1/products?locale=it');

        $response->assertOk();
        $titles = collect($response->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Published Bra'));
        $this->assertFalse($titles->contains('Draft Bra'));
    }

    public function test_product_show_falls_back_to_italian_copy(): void
    {
        $product = $this->seedCatalogProduct(published: true, title: 'Reggiseno Aurora');
        $product->translations()->where('locale', 'en')->delete();

        $slug = $product->translations()->where('locale', 'it')->value('slug');

        $this->getJson('/api/v1/products/'.$slug.'?locale=en')
            ->assertOk()
            ->assertJsonPath('data.title', 'Reggiseno Aurora');
    }

    public function test_merchandising_shelf_returns_ordered_published_products(): void
    {
        $first = $this->seedCatalogProduct(published: true, title: 'First');
        $second = $this->seedCatalogProduct(published: true, title: 'Second');

        $section = MerchandisingSection::query()->firstOrCreate(
            ['slug' => MerchandisingShelf::BestSellers->value],
            [
                'title_it' => 'Best seller',
                'title_en' => 'Best sellers',
                'max_items' => 12,
                'is_active' => true,
            ],
        );

        MerchandisingPin::create([
            'section_id' => $section->id,
            'product_id' => $second->id,
            'position' => 0,
            'mode' => 'include',
        ]);
        MerchandisingPin::create([
            'section_id' => $section->id,
            'product_id' => $first->id,
            'position' => 1,
            'mode' => 'include',
        ]);

        $response = $this->getJson('/api/v1/merchandising/best_sellers?locale=it');

        $response->assertOk();
        $this->assertSame(
            ['Second', 'First'],
            collect($response->json('data'))->pluck('title')->all()
        );
    }

    public function test_site_media_endpoint_returns_audience_slots(): void
    {
        $this->getJson('/api/v1/site-media?locale=it')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'women' => [
                        'welcome',
                        'home_still',
                        'home_video_mp4',
                        'home_video_webm',
                        'new_arrivals_still',
                        'instagram_1',
                        'instagram_2',
                        'instagram_3',
                        'instagram_4',
                        'instagram_5',
                        'instagram_6',
                    ],
                    'men' => [
                        'welcome',
                        'home_still',
                        'home_video_mp4',
                        'home_video_webm',
                        'new_arrivals_still',
                        'instagram_1',
                        'instagram_2',
                        'instagram_3',
                        'instagram_4',
                        'instagram_5',
                        'instagram_6',
                    ],
                    'kids' => [
                        'welcome',
                        'home_still',
                        'home_video_mp4',
                        'home_video_webm',
                        'new_arrivals_still',
                        'instagram_1',
                        'instagram_2',
                        'instagram_3',
                        'instagram_4',
                        'instagram_5',
                        'instagram_6',
                    ],
                ],
            ]);
    }

    public function test_product_show_includes_care_fit_and_complete_the_look(): void
    {
        $main = $this->seedCatalogProduct(published: true, title: 'Look Main');
        $related = $this->seedCatalogProduct(published: true, title: 'Look Related');
        $draftRelated = $this->seedCatalogProduct(published: false, title: 'Look Draft');

        $main->translations()->where('locale', 'it')->update([
            'care_notes' => 'Lavare a 30°',
            'fit_notes' => 'Prendi la tua taglia',
        ]);

        $main->relatedProducts()->sync([
            $related->id => ['position' => 0],
            $draftRelated->id => ['position' => 1],
        ]);

        $slug = $main->translations()->where('locale', 'it')->value('slug');

        $this->getJson('/api/v1/products/'.$slug.'?locale=it')
            ->assertOk()
            ->assertJsonPath('data.care_notes', 'Lavare a 30°')
            ->assertJsonPath('data.fit_notes', 'Prendi la tua taglia')
            ->assertJsonPath('data.fabric', 'Cotone')
            ->assertJsonCount(1, 'data.complete_the_look')
            ->assertJsonPath('data.complete_the_look.0.title', 'Look Related');
    }

    public function test_product_index_includes_facets(): void
    {
        $this->seedCatalogProduct(published: true, title: 'Facet Bra');

        $this->getJson('/api/v1/products?locale=it&in_stock=1')
            ->assertOk()
            ->assertJsonStructure([
                'meta' => [
                    'facets' => [
                        'sizes',
                        'colors' => [['name', 'hex']],
                        'brands' => [['slug', 'name']],
                    ],
                ],
            ]);
    }

    public function test_product_show_includes_related_excluding_complete_the_look(): void
    {
        $main = $this->seedCatalogProduct(published: true, title: 'Main Rel');
        $look = $this->seedCatalogProduct(published: true, title: 'Look Rel');
        $sibling = $this->seedCatalogProduct(published: true, title: 'Sibling Rel');

        // Put look + sibling in same category as main
        $look->update(['category_id' => $main->category_id]);
        $sibling->update(['category_id' => $main->category_id]);

        $main->relatedProducts()->sync([$look->id => ['position' => 0]]);

        $slug = $main->translations()->where('locale', 'it')->value('slug');

        $response = $this->getJson('/api/v1/products/'.$slug.'?locale=it')->assertOk();

        $lookTitles = collect($response->json('data.complete_the_look'))->pluck('title');
        $relatedTitles = collect($response->json('data.related'))->pluck('title');

        $this->assertTrue($lookTitles->contains('Look Rel'));
        $this->assertTrue($relatedTitles->contains('Sibling Rel'));
        $this->assertFalse($relatedTitles->contains('Look Rel'));
        $this->assertFalse($relatedTitles->contains('Main Rel'));
    }

    public function test_clients_cannot_access_admin_dashboard(): void
    {
        $client = \App\Models\User::factory()->create(['role' => 'client']);

        $this->actingAs($client)
            ->get(route('dashboard'))
            ->assertForbidden();
    }

    private function seedCatalogProduct(bool $published, string $title): Product
    {
        $category = Category::create(['parent_id' => null]);
        foreach (['it', 'en'] as $loc) {
            $category->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('category-'.$title, 'category_translations', $loc),
                'name' => 'Category '.$title,
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
            'tissu' => 'Cotone',
            'is_published' => $published,
            'published_at' => $published ? now() : null,
        ]);

        foreach (['it', 'en'] as $loc) {
            $product->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make($title, 'product_translations', $loc),
                'title' => $title,
                'description' => 'Desc',
                'care_notes' => null,
                'fit_notes' => null,
            ]);
        }

        ProductVariant::create([
            'product_id' => $product->id,
            'size' => '3B',
            'color' => 'Nero',
            'color_hex' => '#000000',
            'price' => 39.90,
            'stock' => 5,
        ]);

        return $product;
    }
}
