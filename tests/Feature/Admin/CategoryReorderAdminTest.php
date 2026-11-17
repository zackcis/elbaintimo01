<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\User;
use App\Support\UniqueSlug;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryReorderAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_reorder_sibling_categories(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $parent = $this->makeCategory('Intimo', 'Underwear', 'intimo', null, 0);
        $boxer = $this->makeCategory('Boxer', 'Boxer', 'boxer', $parent->id, 0);
        $slib = $this->makeCategory('Slib', 'Slib', 'slib', $parent->id, 1);

        $this->actingAs($staff)
            ->post(route('categories.reorder'), [
                'parent_id' => $parent->id,
                'ordered_ids' => [$slib->id, $boxer->id],
            ])
            ->assertRedirect(route('categories.index'));

        $this->assertSame(0, $slib->fresh()->position);
        $this->assertSame(1, $boxer->fresh()->position);
    }

    public function test_categories_api_returns_children_in_position_order(): void
    {
        $parent = $this->makeCategory('Intimo', 'Underwear', 'intimo', null, 0);
        $boxer = $this->makeCategory('Boxer', 'Boxer', 'boxer', $parent->id, 1);
        $slib = $this->makeCategory('Slib', 'Slib', 'slib', $parent->id, 0);

        $response = $this->getJson('/api/v1/categories?locale=it');

        $response->assertOk();

        $root = collect($response->json('data'))->firstWhere('slug', 'intimo');
        $this->assertNotNull($root);
        $this->assertSame(
            ['slib', 'boxer'],
            collect($root['children'])->pluck('slug')->all(),
        );
        $this->assertSame($slib->id, $root['children'][0]['id']);
        $this->assertSame($boxer->id, $root['children'][1]['id']);
    }

    public function test_reorder_rejects_incomplete_sibling_set(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $parent = $this->makeCategory('Intimo', 'Underwear', 'intimo', null, 0);
        $boxer = $this->makeCategory('Boxer', 'Boxer', 'boxer', $parent->id, 0);
        $this->makeCategory('Slib', 'Slib', 'slib', $parent->id, 1);

        $this->actingAs($staff)
            ->from(route('categories.index'))
            ->post(route('categories.reorder'), [
                'parent_id' => $parent->id,
                'ordered_ids' => [$boxer->id],
            ])
            ->assertRedirect(route('categories.index'))
            ->assertSessionHasErrors('ordered_ids');
    }

    private function makeCategory(
        string $nameIt,
        string $nameEn,
        string $slug,
        ?int $parentId,
        int $position,
    ): Category {
        $category = Category::create([
            'parent_id' => $parentId,
            'position' => $position,
        ]);

        foreach (['it' => $nameIt, 'en' => $nameEn] as $locale => $name) {
            $category->translations()->create([
                'locale' => $locale,
                'slug' => UniqueSlug::make($slug, 'category_translations', $locale),
                'name' => $name,
            ]);
        }

        return $category;
    }
}
