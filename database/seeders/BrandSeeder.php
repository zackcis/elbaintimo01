<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\BrandTranslation;
use Database\Seeders\Concerns\ScansMediaFolder;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    use ScansMediaFolder;

    public function run(): void
    {
        $logos = $this->mediaFiles('brands');
        $fallback = $this->mediaFiles('products');

        $names = [
            'Victoria\'s Secret',
            'Calvin Klein',
            'La Perla',
            'Agent Provocateur',
            'Savage X Fenty',
            'ThirdLove',
            'Aerie',
            'Hanky Panky',
        ];

        foreach ($names as $name) {
            $exists = BrandTranslation::query()
                ->where('locale', 'it')
                ->where('name', $name)
                ->exists();

            if ($exists) {
                continue;
            }

            $brand = Brand::create([
                'logo' => $this->pickOneImage($logos, $fallback),
            ]);

            foreach (config('harimi.locales', ['it', 'en']) as $loc) {
                $brand->translations()->create([
                    'locale' => $loc,
                    'slug' => \App\Support\UniqueSlug::make($name, 'brand_translations', $loc),
                    'name' => $name,
                ]);
            }
        }
    }
}
