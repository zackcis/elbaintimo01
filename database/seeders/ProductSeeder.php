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
        $womensDresses = $this->categoryByLocalizedName('Dresses');
        $womensTops = $this->categoryByLocalizedName('Tops');
        $womensBottoms = $this->categoryByLocalizedName('Bottoms');
        $mensTops = $this->categoryByLocalizedName('T-Shirts & Shirts');
        $mensBottoms = $this->categoryByLocalizedName('Pants & Shorts');
        $bags = $this->categoryByLocalizedName('Bags');

        foreach (
            [
                'Dresses' => $womensDresses,
                'Tops' => $womensTops,
                'Bottoms' => $womensBottoms,
                'T-Shirts & Shirts' => $mensTops,
                'Pants & Shorts' => $mensBottoms,
                'Bags' => $bags,
            ] as $label => $cat
        ) {
            if ($cat === null) {
                throw new \RuntimeException("Category not found for label: {$label}. Run CategorySeeder first.");
            }
        }

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
            3,
            'Satin',
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
            4,
            'Coton',
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
            2,
            'Soie',
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
            2,
            'Coton',
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
            3,
            'Denim',
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
            2,
            'Coton',
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
            2,
            'Coton',
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
            2,
            'Coton mélangé',
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
            3,
            'Cuir',
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
            2,
            'Nylon',
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
        int $imageCount = 2,
        ?string $tissu = null,
    ): Product {
        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'tissu' => $tissu,
        ]);

        foreach (config('harimi.locales', ['it', 'en']) as $loc) {
            $product->translations()->create([
                'locale' => $loc,
                'title' => $title,
                'description' => $description,
            ]);
        }

        // Create variants
        $primaryImage = true;
        foreach ($variants as $index => $variant) {
            ProductVariant::create([
                'product_id' => $product->id,
                'size' => $variant['size'],
                'color' => $variant['color'],
                'color_hex' => $this->seedHexForColor((string) $variant['color']),
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

    private function categoryByLocalizedName(string $name): ?Category
    {
        return Category::query()
            ->whereHas('translations', function ($q) use ($name) {
                $q->where('locale', config('harimi.admin_list_locale', 'it'))
                    ->where('name', $name);
            })
            ->first();
    }

    private function seedHexForColor(string $color): string
    {
        return match (strtolower(trim($color))) {
            'black' => '#000000',
            'white' => '#FFFFFF',
            'red' => '#E53935',
            'blue' => '#1E88E5',
            'pink' => '#EC407A',
            'gray', 'grey' => '#757575',
            'khaki' => '#C3B091',
            'navy' => '#283593',
            'brown' => '#6D4C41',
            default => '#5E35B1',
        };
    }
}
