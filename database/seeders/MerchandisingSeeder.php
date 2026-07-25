<?php

namespace Database\Seeders;

use App\Enums\MerchandisingShelf;
use App\Models\MerchandisingPin;
use App\Models\MerchandisingSection;
use App\Models\Product;
use Illuminate\Database\Seeder;

class MerchandisingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            MerchandisingShelf::BestSellers->value => ['Best seller', 'Best sellers'],
            MerchandisingShelf::NewArrivals->value => ['Novità', 'New arrivals'],
            MerchandisingShelf::Featured->value => ['In evidenza', 'Featured'],
            MerchandisingShelf::SpecialOffers->value => ['Offerte speciali', 'Special offers'],
        ];

        foreach ($defaults as $slug => [$titleIt, $titleEn]) {
            MerchandisingSection::query()->firstOrCreate(
                ['slug' => $slug],
                [
                    'title_it' => $titleIt,
                    'title_en' => $titleEn,
                    'audience' => null,
                    'max_items' => 12,
                    'rules' => null,
                    'is_active' => true,
                ],
            );
        }

        $products = Product::query()->published()->pluck('id')->all();
        if ($products === []) {
            return;
        }

        $perShelf = 8;

        foreach (MerchandisingSection::query()->whereIn('slug', array_keys($defaults))->get() as $section) {
            if ($section->pins()->exists()) {
                continue;
            }

            $pool = $products;
            shuffle($pool);
            $selection = array_slice($pool, 0, min($perShelf, count($pool)));

            foreach ($selection as $position => $productId) {
                MerchandisingPin::query()->create([
                    'section_id' => $section->id,
                    'product_id' => $productId,
                    'position' => $position,
                    'mode' => 'include',
                ]);
            }
        }
    }
}
