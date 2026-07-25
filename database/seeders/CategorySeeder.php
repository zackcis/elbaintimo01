<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CategoryImage;
use Database\Seeders\Concerns\ScansMediaFolder;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    use ScansMediaFolder;

    /**
     * @var list<string>
     */
    private array $imagePool = [];

    /**
     * @var list<string>
     */
    private array $fallbackPool = [];

    public function run(): void
    {
        $this->imagePool = $this->mediaFiles('categories');
        $this->fallbackPool = $this->mediaFiles('products');

        $women = $this->createCategory(null, 'Donna', 'Women', 'women');
        $men = $this->createCategory(null, 'Uomo', 'Men', 'men');
        $kids = $this->createCategory(null, 'Bambini', 'Kids', 'kids');

        $womenChildren = [
            ['Reggiseno', 'Bras', 'bras'],
            ['Mutande', 'Knickers', 'knickers'],
            ['Lingerie', 'Lingerie', 'lingerie'],
            ['Maglieria', 'Knitwear', 'knitwear'],
            ['Nightwear', 'Nightwear', 'nightwear'],
        ];

        $menChildren = [
            ['Boxer', 'Boxers', 'boxers'],
            ['Slip', 'Briefs', 'briefs'],
            ['Top', 'Tops', 'tops'],
            ['Easywear', 'Easywear', 'easywear'],
            ['Calze', 'Socks', 'socks'],
            ['Costumi', 'Swimsuits', 'swimsuits'],
        ];

        $kidsChildren = [
            ['Intimo', 'Underwear', 'kids-underwear'],
            ['Canottiere', 'Undershirts', 'kids-undershirts'],
            ['Pigiami', 'Pyjamas', 'kids-pyjamas'],
            ['Calze', 'Socks', 'kids-socks'],
        ];

        /** @var array<string, list<array{0: string, 1: string, 2: string}>> */
        $typesByParent = [
            'bras' => [
                ['Balconcino', 'Balconette', 'bras-balconette'],
                ['Triangolo', 'Triangle', 'bras-triangle'],
                ['Push-up', 'Push-up', 'bras-push-up'],
                ['Bralette', 'Bralette', 'bras-bralette'],
                ['A fascia', 'Strapless / Bandeau', 'bras-strapless'],
                ['Senza ferretto', 'Wireless', 'bras-wireless'],
            ],
            'knickers' => [
                ['Slip', 'Briefs', 'knickers-briefs'],
                ['Perizoma', 'Thongs', 'knickers-thongs'],
                ['Boxer', 'Boyshorts', 'knickers-boxers'],
                ['High waist', 'High waist', 'knickers-high-waist'],
            ],
            'lingerie' => [
                ['Body', 'Bodysuits', 'lingerie-bodysuits'],
                ['Guepiere', 'Bustiers', 'lingerie-bustiers'],
                ['Completi', 'Sets', 'lingerie-sets'],
            ],
            'knitwear' => [
                ['Top', 'Tops', 'knitwear-tops'],
                ['Cardigan', 'Cardigans', 'knitwear-cardigans'],
            ],
            'nightwear' => [
                ['Pigiami', 'Pyjamas', 'nightwear-pyjamas'],
                ['Camicie da notte', 'Nightdresses', 'nightwear-nightdresses'],
                ['Accappatoi', 'Robes', 'nightwear-robes'],
            ],
            'boxers' => [
                ['Boxer classici', 'Classic', 'boxers-classic'],
                ['Boxer lunghi', 'Long', 'boxers-long'],
                ['Trunk', 'Trunks', 'boxers-trunks'],
            ],
            'briefs' => [
                ['Slip classici', 'Classic', 'briefs-classic'],
                ['Slip sport', 'Sport', 'briefs-sport'],
            ],
            'tops' => [
                ['T-shirt', 'T-shirts', 'tops-tshirts'],
                ['Canotte', 'Tank tops', 'tops-tanks'],
            ],
            'easywear' => [
                ['Lounge', 'Lounge', 'easywear-lounge'],
                ['Homewear', 'Homewear', 'easywear-homewear'],
            ],
            'socks' => [
                ['Corte', 'Ankle', 'socks-ankle'],
                ['Lunghe', 'Crew', 'socks-crew'],
            ],
            'swimsuits' => [
                ['Slip mare', 'Swim briefs', 'swimsuits-briefs'],
                ['Boxer mare', 'Swim boxers', 'swimsuits-boxers'],
            ],
        ];

        $groups = [
            [$women, $womenChildren],
            [$men, $menChildren],
            [$kids, $kidsChildren],
        ];

        foreach ($groups as [$parent, $children]) {
            foreach ($children as [$it, $en, $slug]) {
                $child = $this->createCategory($parent->id, $it, $en, $slug);
                $this->attachImage($child);

                foreach ($typesByParent[$slug] ?? [] as [$typeIt, $typeEn, $typeSlug]) {
                    $type = $this->createCategory($child->id, $typeIt, $typeEn, $typeSlug);
                    $this->attachImage($type);
                }
            }
        }

        $this->attachImage($women);
        $this->attachImage($men);
        $this->attachImage($kids);
    }

    private function attachImage(Category $category): void
    {
        $path = $this->pickOneImage($this->imagePool, $this->fallbackPool);

        if ($path === null) {
            return;
        }

        CategoryImage::create([
            'category_id' => $category->id,
            'path' => $path,
        ]);
    }

    private function createCategory(?int $parentId, string $nameIt, string $nameEn, string $slug): Category
    {
        $category = Category::create([
            'parent_id' => $parentId,
        ]);

        foreach (['it' => $nameIt, 'en' => $nameEn] as $loc => $name) {
            $category->translations()->create([
                'locale' => $loc,
                'slug' => \App\Support\UniqueSlug::make($slug, 'category_translations', $loc),
                'name' => $name,
            ]);
        }

        return $category;
    }
}
