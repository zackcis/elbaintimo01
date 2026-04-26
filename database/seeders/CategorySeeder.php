<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CategoryImage;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $womensClothing = $this->createCategory(null, "Women's Clothing");
        $mensClothing = $this->createCategory(null, "Men's Clothing");
        $accessories = $this->createCategory(null, 'Accessories');
        $shoes = $this->createCategory(null, 'Shoes');

        $womensDresses = $this->createCategory($womensClothing->id, 'Dresses');
        $womensTops = $this->createCategory($womensClothing->id, 'Tops');
        $womensBottoms = $this->createCategory($womensClothing->id, 'Bottoms');
        $womensOuterwear = $this->createCategory($womensClothing->id, 'Outerwear');

        $mensTops = $this->createCategory($mensClothing->id, 'T-Shirts & Shirts');
        $mensBottoms = $this->createCategory($mensClothing->id, 'Pants & Shorts');
        $mensOuterwear = $this->createCategory($mensClothing->id, 'Jackets & Coats');

        $bags = $this->createCategory($accessories->id, 'Bags');
        $jewelry = $this->createCategory($accessories->id, 'Jewelry');
        $watches = $this->createCategory($accessories->id, 'Watches');

        $womensShoes = $this->createCategory($shoes->id, "Women's Shoes");
        $mensShoes = $this->createCategory($shoes->id, "Men's Shoes");

        CategoryImage::factory()->forCategory($womensClothing)->create(['path' => 'categories/womens-clothing.jpg']);
        CategoryImage::factory()->forCategory($mensClothing)->create(['path' => 'categories/mens-clothing.jpg']);
        CategoryImage::factory()->forCategory($accessories)->create(['path' => 'categories/accessories.jpg']);
        CategoryImage::factory()->forCategory($shoes)->create(['path' => 'categories/shoes.jpg']);

        CategoryImage::factory()->forCategory($womensDresses)->create(['path' => 'categories/womens-dresses.jpg']);
        CategoryImage::factory()->forCategory($womensTops)->create(['path' => 'categories/womens-tops.jpg']);
        CategoryImage::factory()->forCategory($mensTops)->create(['path' => 'categories/mens-tops.jpg']);
        CategoryImage::factory()->forCategory($bags)->create(['path' => 'categories/bags.jpg']);
    }

    private function createCategory(?int $parentId, string $label): Category
    {
        $category = Category::create([
            'parent_id' => $parentId,
        ]);

        foreach (config('harimi.locales', ['it', 'en']) as $loc) {
            $category->translations()->create([
                'locale' => $loc,
                'name' => $label,
            ]);
        }

        return $category;
    }
}
