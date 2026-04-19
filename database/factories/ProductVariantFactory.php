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
        $colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Gray', 'Brown', null];

        return [
            'product_id' => Product::factory(),
            'size' => fake()->randomElement($sizes),
            'color' => fake()->randomElement($colors),
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
