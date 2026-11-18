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

    public function test_merchandising_shelf_applies_brand_rules_and_exclude_pins(): void
    {
        $nikeProduct = $this->seedCatalogProduct(published: true, title: 'Nike Sock');
        $otherProduct = $this->seedCatalogProduct(published: true, title: 'Other Sock');
        $pinned = $this->seedCatalogProduct(published: true, title: 'Pinned Featured');
        $excludedNike = $this->seedCatalogProduct(published: true, title: 'Nike Excluded');

        // Put both Nike products on the same brand.
        $excludedNike->update(['brand_id' => $nikeProduct->brand_id]);

        $section = MerchandisingSection::query()->firstOrCreate(
            ['slug' => MerchandisingShelf::Featured->value],
            [
                'title_it' => 'In evidenza',
                'title_en' => 'Featured',
                'max_items' => 12,
                'is_active' => true,
            ],
        );

        $section->update([
            'rules' => [
                'brand_ids' => [(int) $nikeProduct->brand_id],
            ],
        ]);

        MerchandisingPin::create([
            'section_id' => $section->id,
            'product_id' => $pinned->id,
            'position' => 0,
            'mode' => 'include',
        ]);
        MerchandisingPin::create([
            'section_id' => $section->id,
            'product_id' => $excludedNike->id,
            'position' => 1,
            'mode' => 'exclude',
        ]);

        $titles = collect(
            $this->getJson('/api/v1/merchandising/featured?locale=it')->json('data')
        )->pluck('title');

        $this->assertSame('Pinned Featured', $titles->first());
        $this->assertTrue($titles->contains('Nike Sock'));
        $this->assertFalse($titles->contains('Other Sock'));
        $this->assertFalse($titles->contains('Nike Excluded'));
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
            'season' => 'Autunno-Inverno',
            'warranty' => 'prodotto originale, garantito dal marchio',
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
            ->assertJsonPath('data.season', 'Autunno-Inverno')
            ->assertJsonPath('data.warranty', 'prodotto originale, garantito dal marchio')
            ->assertJsonPath('data.fabric', 'Cotone')
            ->assertJsonCount(1, 'data.complete_the_look')
            ->assertJsonPath('data.complete_the_look.0.title', 'Look Related');
    }

    public function test_product_show_returns_localized_variant_color(): void
    {
        $product = $this->seedCatalogProduct(published: true, title: 'Color Locale');
        $slug = $product->translations()->where('locale', 'it')->value('slug');

        $this->getJson('/api/v1/products/'.$slug.'?locale=it')
            ->assertOk()
            ->assertJsonPath('data.variants.0.color', 'Nero')
            ->assertJsonPath('data.variants.0.color_key', 'Nero');

        $this->getJson('/api/v1/products/'.$slug.'?locale=en')
            ->assertOk()
            ->assertJsonPath('data.variants.0.color', 'Black')
            ->assertJsonPath('data.variants.0.color_key', 'Nero');
    }

    public function test_product_show_includes_image_color_key(): void
    {
        $product = $this->seedCatalogProduct(published: true, title: 'Color Images');
        $product->images()->create([
            'path' => 'products/nero.jpg',
            'color_key' => 'Nero',
            'is_primary' => true,
            'position' => 0,
        ]);
        $product->images()->create([
            'path' => 'products/shared.jpg',
            'color_key' => null,
            'is_primary' => false,
            'position' => 1,
        ]);

        $slug = $product->translations()->where('locale', 'it')->value('slug');

        $this->getJson('/api/v1/products/'.$slug.'?locale=it')
            ->assertOk()
            ->assertJsonPath('data.images.0.color_key', 'Nero')
            ->assertJsonPath('data.images.0.color', 'Nero')
            ->assertJsonPath('data.images.1.color_key', null);

        $this->getJson('/api/v1/products/'.$slug.'?locale=en')
            ->assertOk()
            ->assertJsonPath('data.images.0.color_key', 'Nero')
            ->assertJsonPath('data.images.0.color', 'Black');
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

    public function test_search_returns_categories_brands_and_products_with_audience(): void
    {
        $women = Category::create(['parent_id' => null, 'position' => 0]);
        foreach (['it', 'en'] as $loc) {
            $women->translations()->create([
                'locale' => $loc,
                'slug' => 'women',
                'name' => $loc === 'it' ? 'Donna' : 'Women',
            ]);
        }

        $calze = Category::create(['parent_id' => $women->id, 'position' => 0]);
        foreach (['it', 'en'] as $loc) {
            $calze->translations()->create([
                'locale' => $loc,
                'slug' => 'calze-search-test',
                'name' => 'Calze SearchTest',
            ]);
        }

        $product = $this->seedCatalogProduct(published: true, title: 'Slip SearchTest');
        $product->update(['category_id' => $calze->id]);

        $brand = Brand::query()->findOrFail($product->brand_id);
        $brand->translations()->where('locale', 'it')->update(['name' => 'Brand SearchTest']);
        $brand->translations()->where('locale', 'en')->update(['name' => 'Brand SearchTest']);

        $response = $this->getJson('/api/v1/search?locale=it&q=SearchTest')->assertOk();

        $categories = collect($response->json('data.categories'));
        $brands = collect($response->json('data.brands'));
        $products = collect($response->json('data.products'));

        $this->assertTrue($categories->contains(fn ($c) => $c['slug'] === 'calze-search-test' && $c['audience'] === 'women'));
        $this->assertTrue($brands->contains(fn ($b) => $b['name'] === 'Brand SearchTest'));
        $this->assertTrue($products->contains(fn ($p) => $p['title'] === 'Slip SearchTest' && $p['audience'] === 'women'));
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
            'color_it' => 'Nero',
            'color_en' => 'Black',
            'color_hex' => '#000000',
            'price' => 39.90,
            'stock' => 5,
        ]);

        return $product;
    }
}
