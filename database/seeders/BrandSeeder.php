<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = [
            ['name' => 'Victoria\'s Secret'],
            ['name' => 'Calvin Klein'],
            ['name' => 'La Perla'],
            ['name' => 'Agent Provocateur'],
            ['name' => 'Savage X Fenty'],
            ['name' => 'ThirdLove'],
            ['name' => 'Aerie'],
            ['name' => 'Hanky Panky'],
        ];

        foreach ($brands as $brand) {
            Brand::firstOrCreate(['name' => $brand['name']], $brand);
        }
    }
}
