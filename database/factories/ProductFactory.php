<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'brand_id' => null,
            'tissu' => fake()->optional(0.65)->randomElement(['Coton', 'Soie', 'Dentelle', 'Polyester', 'Laine', 'Modal']),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Product $product): void {
            $title = fake()->words(3, true);
            $description = fake()->paragraph(3);
            foreach (config('harimi.locales', ['it', 'en']) as $loc) {
                $product->translations()->create([
                    'locale' => $loc,
                    'title' => $title,
                    'description' => $description,
                ]);
            }
        });
    }

    public function forCategory(Category $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => $category->id,
        ]);
    }
}
