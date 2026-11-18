<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', null];
        $colors = [
            ['Nero', 'Black'],
            ['Bianco', 'White'],
            ['Rosso', 'Red'],
            ['Blu', 'Blue'],
            ['Verde', 'Green'],
            ['Giallo', 'Yellow'],
            ['Rosa', 'Pink'],
            ['Viola', 'Purple'],
            ['Grigio', 'Gray'],
            ['Marrone', 'Brown'],
        ];
        [$colorIt, $colorEn] = fake()->randomElement($colors);

        return [
            'product_id' => Product::factory(),
            'size' => fake()->randomElement($sizes),
            'color' => $colorIt,
            'color_it' => $colorIt,
            'color_en' => $colorEn,
            'color_hex' => '#'.strtoupper(str_pad(dechex(fake()->numberBetween(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT)),
            'price' => fake()->randomFloat(2, 9.99, 999.99),
            'stock' => fake()->numberBetween(0, 100),
        ];
    }

    /**
     * Indicate that the variant belongs to a specific product.
     */
    public function forProduct(Product $product): static
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => $product->id,
        ]);
    }
}
