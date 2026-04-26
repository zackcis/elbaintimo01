<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\BrandTranslation;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
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
                'logo' => null,
            ]);

            foreach (config('harimi.locales', ['it', 'en']) as $loc) {
                $brand->translations()->create([
                    'locale' => $loc,
                    'name' => $name,
                ]);
            }
        }
    }
}
