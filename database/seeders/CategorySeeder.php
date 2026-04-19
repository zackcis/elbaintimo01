<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CategoryImage;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create parent categories
        $womensClothing = Category::create(['name' => "Women's Clothing"]);
        $mensClothing = Category::create(['name' => "Men's Clothing"]);
        $accessories = Category::create(['name' => 'Accessories']);
        $shoes = Category::create(['name' => 'Shoes']);

        // Create child categories for Women's Clothing
        $womensDresses = Category::create([
            'name' => 'Dresses',
            'parent_id' => $womensClothing->id,
        ]);
        $womensTops = Category::create([
            'name' => 'Tops',
            'parent_id' => $womensClothing->id,
        ]);
        $womensBottoms = Category::create([
            'name' => 'Bottoms',
            'parent_id' => $womensClothing->id,
        ]);
        $womensOuterwear = Category::create([
            'name' => 'Outerwear',
            'parent_id' => $womensClothing->id,
        ]);

        // Create child categories for Men's Clothing
        $mensTops = Category::create([
            'name' => 'T-Shirts & Shirts',
            'parent_id' => $mensClothing->id,
        ]);
        $mensBottoms = Category::create([
            'name' => 'Pants & Shorts',
            'parent_id' => $mensClothing->id,
        ]);
        $mensOuterwear = Category::create([
            'name' => 'Jackets & Coats',
            'parent_id' => $mensClothing->id,
        ]);

        // Create child categories for Accessories
        $bags = Category::create([
            'name' => 'Bags',
            'parent_id' => $accessories->id,
        ]);
        $jewelry = Category::create([
            'name' => 'Jewelry',
            'parent_id' => $accessories->id,
        ]);
        $watches = Category::create([
            'name' => 'Watches',
            'parent_id' => $accessories->id,
        ]);

        // Create child categories for Shoes
        $womensShoes = Category::create([
            'name' => "Women's Shoes",
            'parent_id' => $shoes->id,
        ]);
        $mensShoes = Category::create([
            'name' => "Men's Shoes",
            'parent_id' => $shoes->id,
        ]);

        // Add images to parent categories
        CategoryImage::factory()->forCategory($womensClothing)->create(['path' => 'categories/womens-clothing.jpg']);
        CategoryImage::factory()->forCategory($mensClothing)->create(['path' => 'categories/mens-clothing.jpg']);
        CategoryImage::factory()->forCategory($accessories)->create(['path' => 'categories/accessories.jpg']);
        CategoryImage::factory()->forCategory($shoes)->create(['path' => 'categories/shoes.jpg']);

        // Add images to some child categories
        CategoryImage::factory()->forCategory($womensDresses)->create(['path' => 'categories/womens-dresses.jpg']);
        CategoryImage::factory()->forCategory($womensTops)->create(['path' => 'categories/womens-tops.jpg']);
        CategoryImage::factory()->forCategory($mensTops)->create(['path' => 'categories/mens-tops.jpg']);
        CategoryImage::factory()->forCategory($bags)->create(['path' => 'categories/bags.jpg']);
    }
}
