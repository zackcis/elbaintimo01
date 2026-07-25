<?php

namespace Tests\Feature\Admin;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Support\UniqueSlug;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryLowStockTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_view_low_stock_page_and_filters(): void
    {
        config(['harimi.inventory.low_stock_threshold' => 5]);

        $staff = User::factory()->create(['role' => 'staff']);
        $this->makeVariant(0);
        $this->makeVariant(3);
        $this->makeVariant(20);

        $this->actingAs($staff)
            ->get(route('inventory.low-stock'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('inventory/low-stock')
                ->where('threshold', 5)
                ->where('counts.all', 2)
                ->where('counts.out', 1)
                ->where('counts.low', 1)
                ->has('variants.data', 2)
            );

        $this->actingAs($staff)
            ->get(route('inventory.low-stock', ['filter' => 'out']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filter', 'out')
                ->has('variants.data', 1)
                ->where('variants.data.0.stock', 0)
            );
    }

    private function makeVariant(int $stock): ProductVariant
    {
        static $n = 0;
        $n++;

        $category = Category::create(['parent_id' => null]);
        foreach (['it', 'en'] as $loc) {
            $category->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('cat-inv-'.$n, 'category_translations', $loc),
                'name' => 'Cat',
            ]);
        }

        $brand = Brand::create(['logo' => null]);
        foreach (['it', 'en'] as $loc) {
            $brand->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('brand-inv-'.$n, 'brand_translations', $loc),
                'name' => 'Brand',
            ]);
        }

        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'is_published' => true,
            'published_at' => now(),
        ]);

        foreach (['it', 'en'] as $loc) {
            $product->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('product-inv-'.$n, 'product_translations', $loc),
                'title' => 'Product '.$n,
                'description' => null,
            ]);
        }

        return ProductVariant::create([
            'product_id' => $product->id,
            'size' => '3B',
            'color' => 'Nero',
            'color_hex' => '#000000',
            'price' => 20,
            'stock' => $stock,
        ]);
    }
}
