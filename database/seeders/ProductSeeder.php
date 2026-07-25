<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Database\Seeders\Concerns\ScansMediaFolder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    use ScansMediaFolder;

    /**
     * @var list<array{string, string}>  [name, hex]
     */
    private array $colors = [
        ['Nero', '#141414'],
        ['Bianco', '#FFFFFF'],
        ['Avorio', '#F7F3EC'],
        ['Nude', '#C4A484'],
        ['Rosa', '#E8B4B8'],
        ['Bordeaux', '#6B1E2A'],
        ['Blu', '#2B3A55'],
        ['Grigio', '#6B6560'],
        ['Azzurro', '#A9C6D9'],
        ['Verde Salvia', '#8A9A7B'],
    ];

    /**
     * @var list<string>
     */
    private array $imagePool = [];

    private Collection $brands;

    public function run(): void
    {
        $this->imagePool = $this->mediaFiles('products');

        $this->brands = Brand::all();
        if ($this->brands->isEmpty()) {
            throw new \RuntimeException('Brands must be seeded before products. Run BrandSeeder first.');
        }

        // slug => [sizes, priceMin, priceMax, tissus[], productNames[]]
        $catalog = [
            // --- Women ---
            'bras' => [
                ['2B', '3B', '4B', '3C', '4C', '4D'],
                34.90, 64.90, ['Microfibra', 'Pizzo', 'Seta'],
                ['Reggiseno Aurora', 'Reggiseno Seta Soft', 'Reggiseno Balconcino', 'Reggiseno Triangolo', 'Reggiseno Push-up Lumière'],
            ],
            'knickers' => [
                ['XS', 'S', 'M', 'L', 'XL'],
                9.90, 24.90, ['Cotone', 'Microfibra', 'Pizzo'],
                ['Slip Essential', 'Culotte Vita Alta', 'Brasiliana Pizzo', 'Perizoma Comfort', 'Slip Brasiliano'],
            ],
            'lingerie' => [
                ['XS', 'S', 'M', 'L'],
                49.90, 119.90, ['Pizzo', 'Raso', 'Seta'],
                ['Body Pizzo Notte', 'Guêpière Séduction', 'Completo Raso', 'Reggicalze Chic'],
            ],
            'knitwear' => [
                ['XS', 'S', 'M', 'L', 'XL'],
                39.90, 89.90, ['Lana', 'Cashmere Blend', 'Cotone'],
                ['Maglia Costina', 'Cardigan Morbido', 'Dolcevita Lana', 'Maglia Girocollo'],
            ],
            'nightwear' => [
                ['XS', 'S', 'M', 'L', 'XL'],
                29.90, 79.90, ['Raso', 'Cotone', 'Seta'],
                ['Pigiama Raso', 'Camicia da Notte', 'Vestaglia Seta', 'Completo Notte Cotone'],
            ],

            // --- Men ---
            'boxers' => [
                ['S', 'M', 'L', 'XL', 'XXL'],
                12.90, 29.90, ['Cotone', 'Jersey', 'Microfibra'],
                ['Boxer Stretch', 'Boxer Cotone', 'Boxer Sport', 'Trunk Comfort'],
            ],
            'briefs' => [
                ['S', 'M', 'L', 'XL', 'XXL'],
                9.90, 22.90, ['Cotone', 'Cotone Bio', 'Microfibra'],
                ['Slip Uomo Classic', 'Slip Sport', 'Slip Cotone Bio'],
            ],
            'tops' => [
                ['S', 'M', 'L', 'XL', 'XXL'],
                14.90, 34.90, ['Cotone', 'Termico', 'Jersey'],
                ['Canotta Essential', 'T-shirt Intima', 'Maglia Termica'],
            ],
            'easywear' => [
                ['S', 'M', 'L', 'XL', 'XXL'],
                29.90, 69.90, ['Felpa', 'Jersey', 'Cotone'],
                ['Felpa Relax', 'Pantalone Jersey', 'Set Loungewear'],
            ],
            'socks' => [
                ['39-42', '43-46'],
                6.90, 16.90, ['Cotone', 'Filo di Scozia', 'Sport'],
                ['Calze Cotone Pack', 'Calze Sportive', 'Calze Eleganti'],
            ],
            'swimsuits' => [
                ['S', 'M', 'L', 'XL'],
                24.90, 49.90, ['Poliammide', 'Quick Dry'],
                ['Boxer Mare', 'Slip Mare', 'Costume Sport'],
            ],

            // --- Kids ---
            'kids-underwear' => [
                ['4A', '6A', '8A', '10A', '12A'],
                8.90, 18.90, ['Cotone', 'Cotone Bio'],
                ['Slip Bimbo Cotone', 'Slip Bimba Fantasia', 'Boxer Bimbo Pack'],
            ],
            'kids-undershirts' => [
                ['4A', '6A', '8A', '10A', '12A'],
                7.90, 16.90, ['Cotone', 'Cotone Bio'],
                ['Canottiera Bimbo', 'Body Neonato', 'Maglia Intima Kids'],
            ],
            'kids-pyjamas' => [
                ['4A', '6A', '8A', '10A', '12A'],
                16.90, 34.90, ['Jersey', 'Cotone', 'Pile'],
                ['Pigiama Stelle', 'Pigiama Cotone', 'Pigiama Corto Estate'],
            ],
            'kids-socks' => [
                ['23-26', '27-30', '31-34'],
                4.90, 12.90, ['Cotone', 'Antiscivolo', 'Sport'],
                ['Calze Bimbo Pack', 'Calzini Antiscivolo', 'Calze Sportive Kids'],
            ],
        ];

        foreach ($catalog as $slug => [$sizes, $priceMin, $priceMax, $tissus, $names]) {
            $category = $this->categoryBySlug($slug);
            if ($category === null) {
                continue;
            }

            $types = $category->children()->get();

            if ($types->isEmpty()) {
                foreach ($names as $name) {
                    $this->createProduct($category, $name, $sizes, $priceMin, $priceMax, $tissus);
                }

                continue;
            }

            // Attach products to L3 type categories (round-robin) so type-filtered
            // PLPs have stock; L2 pages stay complete via descendant expansion.
            $total = max(count($names), $types->count() * 2);
            for ($i = 0; $i < $total; $i++) {
                $name = $names[$i % count($names)];
                $round = intdiv($i, count($names));
                if ($round > 0) {
                    $name .= ' '.$this->nameSuffix($round);
                }

                $this->createProduct($types[$i % $types->count()], $name, $sizes, $priceMin, $priceMax, $tissus);
            }
        }
    }

    private function nameSuffix(int $round): string
    {
        $suffixes = ['II', 'III', 'IV', 'V', 'VI'];

        return $suffixes[min($round - 1, count($suffixes) - 1)];
    }

    private function categoryBySlug(string $slug): ?Category
    {
        return Category::query()
            ->whereHas('translations', fn ($q) => $q->where('slug', $slug))
            ->first();
    }

    /**
     * @param  list<string>  $sizes
     * @param  list<string>  $tissus
     */
    private function createProduct(
        Category $category,
        string $name,
        array $sizes,
        float $priceMin,
        float $priceMax,
        array $tissus,
    ): void {
        $price = $this->randomPrice($priceMin, $priceMax);

        // Put roughly a quarter of the catalogue on sale so the storefront has
        // realistic discounted pricing to render (original -> struck-through).
        $compareAt = null;
        if (random_int(1, 100) <= 28) {
            $compareAt = $price;
            $discount = random_int(20, 40) / 100;
            $price = floor($compareAt * (1 - $discount)) + 0.90;
            if ($price >= $compareAt) {
                $price = max($compareAt - 5.00, 1.90);
            }
        }

        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $this->brands->random()->id,
            'tissu' => $tissus[array_rand($tissus)],
            'is_published' => true,
            'published_at' => now(),
        ]);

        $description = 'Capo HARIMI selezionato per comfort e qualità dei materiali. '
            .'Vestibilità curata e finiture pulite per l\'uso quotidiano.';

        foreach (config('harimi.locales', ['it', 'en']) as $loc) {
            $product->translations()->create([
                'locale' => $loc,
                'slug' => \App\Support\UniqueSlug::make($name, 'product_translations', $loc),
                'title' => $name,
                'description' => $description,
                'care_notes' => $loc === 'it' ? 'Lavare a 30°. Non candeggiare.' : 'Wash at 30°C. Do not bleach.',
                'fit_notes' => $loc === 'it' ? 'Veste regolare. Consulta la guida alle taglie.' : 'True to size. See the size guide.',
            ]);
        }

        // 1-2 colors × 2-3 sizes -> a handful of variants per product.
        $chosenColors = $this->pickColors(random_int(1, 2));
        $chosenSizes = $this->pickSizes($sizes, random_int(2, 3));

        foreach ($chosenColors as [$colorName, $colorHex]) {
            foreach ($chosenSizes as $size) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'size' => $size,
                    'color' => $colorName,
                    'color_hex' => $colorHex,
                    'price' => $price,
                    'compare_at_price' => $compareAt,
                    'stock' => random_int(0, 40),
                ]);
            }
        }

        $images = $this->pickImages($this->imagePool, random_int(2, 4));
        foreach ($images as $i => $path) {
            ProductImage::create([
                'product_id' => $product->id,
                'path' => $path,
                'is_primary' => $i === 0,
                'position' => $i,
            ]);
        }
    }

    private function randomPrice(float $min, float $max): float
    {
        $whole = random_int((int) floor($min), (int) floor($max));

        return $whole + 0.90;
    }

    /**
     * @return list<array{string, string}>
     */
    private function pickColors(int $count): array
    {
        $pool = $this->colors;
        shuffle($pool);

        return array_slice($pool, 0, min($count, count($pool)));
    }

    /**
     * @param  list<string>  $sizes
     * @return list<string>
     */
    private function pickSizes(array $sizes, int $count): array
    {
        shuffle($sizes);

        return array_slice($sizes, 0, min($count, count($sizes)));
    }
}
