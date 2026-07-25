<?php

namespace Tests\Feature\Admin;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Support\UniqueSlug;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductDiscountAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_save_variant_with_was_price_higher_than_selling(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        [$category, $brand] = $this->catalog();

        $this->actingAs($staff)
            ->post(route('products.store'), $this->payload($category->id, $brand->id, [
                'price' => 29.9,
                'compare_at_price' => 49.9,
            ]))
            ->assertRedirect();

        $this->assertDatabaseHas('product_variants', [
            'price' => 29.90,
            'compare_at_price' => 49.90,
        ]);
    }

    public function test_was_price_must_be_higher_than_selling_price(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        [$category, $brand] = $this->catalog();

        $this->actingAs($staff)
            ->from(route('products.create'))
            ->post(route('products.store'), $this->payload($category->id, $brand->id, [
                'price' => 49.9,
                'compare_at_price' => 29.9,
            ]))
            ->assertRedirect(route('products.create'))
            ->assertSessionHasErrors('variants.0.compare_at_price');
    }

    public function test_empty_was_price_clears_discount(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        [$category, $brand] = $this->catalog();

        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'is_published' => true,
            'published_at' => now(),
        ]);
        foreach (['it', 'en'] as $loc) {
            $product->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('Sale Item', 'product_translations', $loc),
                'title' => 'Sale Item',
                'description' => null,
            ]);
        }
        $product->variants()->create([
            'size' => 'M',
            'color' => 'Nero',
            'color_hex' => '#000000',
            'price' => 29.9,
            'compare_at_price' => 49.9,
            'stock' => 3,
        ]);

        $payload = $this->payload($category->id, $brand->id, [
            'price' => 29.9,
            // omit compare_at_price → null
        ]);
        $payload['title'] = ['it' => 'Sale Item', 'en' => 'Sale Item'];
        $payload['is_published'] = '1';

        $this->actingAs($staff)
            ->put(route('products.update', $product), $payload)
            ->assertRedirect();

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $product->id,
            'price' => 29.90,
            'compare_at_price' => null,
        ]);
    }

    /**
     * @return array{0: Category, 1: Brand}
     */
    private function catalog(): array
    {
        $category = Category::create(['parent_id' => null]);
        foreach (['it', 'en'] as $loc) {
            $category->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('cat-discount', 'category_translations', $loc),
                'name' => 'Cat Discount',
            ]);
        }

        $brand = Brand::create(['logo' => null]);
        foreach (['it', 'en'] as $loc) {
            $brand->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('brand-discount', 'brand_translations', $loc),
                'name' => 'Brand Discount',
            ]);
        }

        return [$category, $brand];
    }

    /**
     * @param  array{price: float|int|string, compare_at_price?: float|int|string|null}  $variant
     * @return array<string, mixed>
     */
    private function payload(int $categoryId, int $brandId, array $variant): array
    {
        $row = [
            'size' => 'M',
            'color' => 'Nero',
            'color_hex' => '#000000',
            'price' => $variant['price'],
            'stock' => 3,
        ];
        if (array_key_exists('compare_at_price', $variant) && $variant['compare_at_price'] !== null) {
            $row['compare_at_price'] = $variant['compare_at_price'];
        }

        return [
            'title' => ['it' => 'Discount Product', 'en' => 'Discount Product'],
            'description' => ['it' => null, 'en' => null],
            'category_id' => $categoryId,
            'brand_id' => $brandId,
            'tissu' => null,
            'variants' => [$row],
        ];
    }
}
