<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get categories
        $womensDresses = Category::where('name', 'Dresses')->first();
        $womensTops = Category::where('name', 'Tops')->first();
        $womensBottoms = Category::where('name', 'Bottoms')->first();
        $mensTops = Category::where('name', 'T-Shirts & Shirts')->first();
        $mensBottoms = Category::where('name', 'Pants & Shorts')->first();
        $bags = Category::where('name', 'Bags')->first();

        // Get brands
        $brands = Brand::all();
        if ($brands->isEmpty()) {
            throw new \Exception('Brands must be seeded before products. Please run BrandSeeder first.');
        }

        // Create Women's Dresses
        $this->createProductWithVariants(
            $womensDresses,
            $brands->random(),
            'Elegant Evening Dress',
            'A stunning evening dress perfect for special occasions. Features a flowing silhouette and elegant design.',
            [
                ['size' => 'S', 'color' => 'Black', 'price' => 129.99, 'stock' => 25],
                ['size' => 'M', 'color' => 'Black', 'price' => 129.99, 'stock' => 30],
                ['size' => 'L', 'color' => 'Black', 'price' => 129.99, 'stock' => 20],
                ['size' => 'S', 'color' => 'Red', 'price' => 129.99, 'stock' => 15],
                ['size' => 'M', 'color' => 'Red', 'price' => 129.99, 'stock' => 18],
            ],
            3
        );

        $this->createProductWithVariants(
            $womensDresses,
            $brands->random(),
            'Casual Summer Dress',
            'Comfortable and stylish summer dress made from breathable fabric. Perfect for everyday wear.',
            [
                ['size' => 'XS', 'color' => 'White', 'price' => 49.99, 'stock' => 40],
                ['size' => 'S', 'color' => 'White', 'price' => 49.99, 'stock' => 50],
                ['size' => 'M', 'color' => 'White', 'price' => 49.99, 'stock' => 45],
                ['size' => 'L', 'color' => 'White', 'price' => 49.99, 'stock' => 35],
                ['size' => 'M', 'color' => 'Blue', 'price' => 49.99, 'stock' => 30],
                ['size' => 'L', 'color' => 'Blue', 'price' => 49.99, 'stock' => 25],
            ],
            4
        );

        // Create Women's Tops
        $this->createProductWithVariants(
            $womensTops,
            $brands->random(),
            'Silk Blouse',
            'Luxurious silk blouse with a classic fit. Perfect for both professional and casual settings.',
            [
                ['size' => 'S', 'color' => 'White', 'price' => 79.99, 'stock' => 20],
                ['size' => 'M', 'color' => 'White', 'price' => 79.99, 'stock' => 25],
                ['size' => 'L', 'color' => 'White', 'price' => 79.99, 'stock' => 18],
                ['size' => 'S', 'color' => 'Pink', 'price' => 79.99, 'stock' => 15],
                ['size' => 'M', 'color' => 'Pink', 'price' => 79.99, 'stock' => 20],
            ],
            2
        );

        $this->createProductWithVariants(
            $womensTops,
            $brands->random(),
            'Casual T-Shirt',
            'Soft and comfortable cotton t-shirt. Available in multiple colors and sizes.',
            [
                ['size' => 'XS', 'color' => 'Black', 'price' => 29.99, 'stock' => 60],
                ['size' => 'S', 'color' => 'Black', 'price' => 29.99, 'stock' => 70],
                ['size' => 'M', 'color' => 'Black', 'price' => 29.99, 'stock' => 65],
                ['size' => 'L', 'color' => 'Black', 'price' => 29.99, 'stock' => 55],
                ['size' => 'XL', 'color' => 'Black', 'price' => 29.99, 'stock' => 40],
                ['size' => 'M', 'color' => 'White', 'price' => 29.99, 'stock' => 50],
                ['size' => 'L', 'color' => 'White', 'price' => 29.99, 'stock' => 45],
            ],
            2
        );

        // Create Women's Bottoms
        $this->createProductWithVariants(
            $womensBottoms,
            $brands->random(),
            'High-Waisted Jeans',
            'Classic high-waisted jeans with a flattering fit. Made from premium denim.',
            [
                ['size' => '26', 'color' => 'Blue', 'price' => 89.99, 'stock' => 30],
                ['size' => '28', 'color' => 'Blue', 'price' => 89.99, 'stock' => 35],
                ['size' => '30', 'color' => 'Blue', 'price' => 89.99, 'stock' => 40],
                ['size' => '32', 'color' => 'Blue', 'price' => 89.99, 'stock' => 25],
                ['size' => '28', 'color' => 'Black', 'price' => 89.99, 'stock' => 20],
                ['size' => '30', 'color' => 'Black', 'price' => 89.99, 'stock' => 25],
            ],
            3
        );

        // Create Men's Tops
        $this->createProductWithVariants(
            $mensTops,
            $brands->random(),
            'Classic Oxford Shirt',
            'Timeless Oxford shirt perfect for business or casual wear. Made from premium cotton.',
            [
                ['size' => 'S', 'color' => 'White', 'price' => 69.99, 'stock' => 35],
                ['size' => 'M', 'color' => 'White', 'price' => 69.99, 'stock' => 40],
                ['size' => 'L', 'color' => 'White', 'price' => 69.99, 'stock' => 38],
                ['size' => 'XL', 'color' => 'White', 'price' => 69.99, 'stock' => 25],
                ['size' => 'M', 'color' => 'Blue', 'price' => 69.99, 'stock' => 30],
                ['size' => 'L', 'color' => 'Blue', 'price' => 69.99, 'stock' => 28],
            ],
            2
        );

        $this->createProductWithVariants(
            $mensTops,
            $brands->random(),
            'Cotton T-Shirt',
            'Comfortable and durable cotton t-shirt. Perfect for everyday wear.',
            [
                ['size' => 'S', 'color' => 'Black', 'price' => 24.99, 'stock' => 80],
                ['size' => 'M', 'color' => 'Black', 'price' => 24.99, 'stock' => 90],
                ['size' => 'L', 'color' => 'Black', 'price' => 24.99, 'stock' => 85],
                ['size' => 'XL', 'color' => 'Black', 'price' => 24.99, 'stock' => 70],
                ['size' => 'XXL', 'color' => 'Black', 'price' => 24.99, 'stock' => 50],
                ['size' => 'M', 'color' => 'Gray', 'price' => 24.99, 'stock' => 60],
                ['size' => 'L', 'color' => 'Gray', 'price' => 24.99, 'stock' => 55],
            ],
            2
        );

        // Create Men's Bottoms
        $this->createProductWithVariants(
            $mensBottoms,
            $brands->random(),
            'Classic Chinos',
            'Versatile chinos that can be dressed up or down. Perfect for any occasion.',
            [
                ['size' => '30', 'color' => 'Khaki', 'price' => 79.99, 'stock' => 40],
                ['size' => '32', 'color' => 'Khaki', 'price' => 79.99, 'stock' => 45],
                ['size' => '34', 'color' => 'Khaki', 'price' => 79.99, 'stock' => 50],
                ['size' => '36', 'color' => 'Khaki', 'price' => 79.99, 'stock' => 35],
                ['size' => '32', 'color' => 'Navy', 'price' => 79.99, 'stock' => 30],
                ['size' => '34', 'color' => 'Navy', 'price' => 79.99, 'stock' => 35],
            ],
            2
        );

        // Create Bags
        $this->createProductWithVariants(
            $bags,
            $brands->random(),
            'Leather Handbag',
            'Elegant leather handbag with multiple compartments. Perfect for daily use.',
            [
                ['size' => null, 'color' => 'Black', 'price' => 199.99, 'stock' => 15],
                ['size' => null, 'color' => 'Brown', 'price' => 199.99, 'stock' => 12],
                ['size' => null, 'color' => 'Red', 'price' => 199.99, 'stock' => 8],
            ],
            3
        );

        $this->createProductWithVariants(
            $bags,
            $brands->random(),
            'Backpack',
            'Stylish and functional backpack. Perfect for work or travel.',
            [
                ['size' => null, 'color' => 'Black', 'price' => 79.99, 'stock' => 50],
                ['size' => null, 'color' => 'Gray', 'price' => 79.99, 'stock' => 45],
                ['size' => null, 'color' => 'Blue', 'price' => 79.99, 'stock' => 40],
            ],
            2
        );
    }

    /**
     * Helper method to create a product with variants and images.
     */
    private function createProductWithVariants(
        Category $category,
        Brand $brand,
        string $title,
        string $description,
        array $variants,
        int $imageCount = 2
    ): Product {
        // Create the product
        $product = Product::create([
            'title' => $title,
            'description' => $description,
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);

        // Create variants
        $primaryImage = true;
        foreach ($variants as $index => $variant) {
            ProductVariant::create([
                'product_id' => $product->id,
                'size' => $variant['size'],
                'color' => $variant['color'],
                'price' => $variant['price'],
                'stock' => $variant['stock'],
            ]);
        }

        // Create images
        for ($i = 0; $i < $imageCount; $i++) {
            ProductImage::create([
                'product_id' => $product->id,
                'path' => "products/{$product->id}/image-".($i + 1).'.jpg',
                'is_primary' => $primaryImage && $i === 0,
                'position' => $i,
            ]);
        }

        return $product;
    }
}
