<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'parent_id' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Category $category): void {
            $base = fake()->unique()->words(2, true);
            foreach (config('harimi.locales', ['it', 'en']) as $loc) {
                $category->translations()->create([
                    'locale' => $loc,
                    'name' => $base,
                ]);
            }
        });
    }

    public function childOf(Category $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parent->id,
        ]);
    }
}
