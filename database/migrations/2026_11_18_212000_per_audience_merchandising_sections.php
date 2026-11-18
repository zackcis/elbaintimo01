<?php

use App\Enums\MerchandisingShelf;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var list<string> */
    private array $audiences = ['women', 'men', 'kids'];

    public function up(): void
    {
        Schema::table('merchandising_sections', function (Blueprint $table) {
            $table->dropUnique(['slug']);
        });

        $defaults = [
            MerchandisingShelf::BestSellers->value => ['Best seller', 'Best sellers'],
            MerchandisingShelf::NewArrivals->value => ['Novità', 'New arrivals'],
            MerchandisingShelf::Featured->value => ['In evidenza', 'Featured'],
            MerchandisingShelf::SpecialOffers->value => ['Offerte speciali', 'Special offers'],
        ];

        $now = now();
        $bySlug = DB::table('merchandising_sections')->orderBy('id')->get()->groupBy('slug');

        foreach ($defaults as $slug => [$titleIt, $titleEn]) {
            $rows = $bySlug->get($slug, collect());
            $template = $rows->first();

            $templatePins = $template
                ? DB::table('merchandising_pins')
                    ->where('section_id', $template->id)
                    ->orderBy('position')
                    ->orderBy('id')
                    ->get()
                : collect();

            foreach ($this->audiences as $audience) {
                $existing = $rows->first(fn ($row) => $row->audience === $audience);
                if ($existing !== null) {
                    continue;
                }

                $sectionId = DB::table('merchandising_sections')->insertGetId([
                    'slug' => $slug,
                    'title_it' => $template->title_it ?? $titleIt,
                    'title_en' => $template->title_en ?? $titleEn,
                    'audience' => $audience,
                    'max_items' => (int) ($template->max_items ?? 12),
                    'rules' => $template->rules ?? null,
                    'is_active' => (bool) ($template->is_active ?? true),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                foreach ($templatePins as $pin) {
                    DB::table('merchandising_pins')->insert([
                        'section_id' => $sectionId,
                        'product_id' => $pin->product_id,
                        'position' => (int) $pin->position,
                        'mode' => $pin->mode ?: 'include',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }

        // Remove legacy null-audience rows and any extras outside women/men/kids.
        $keepIds = DB::table('merchandising_sections')
            ->whereIn('slug', array_keys($defaults))
            ->whereIn('audience', $this->audiences)
            ->pluck('id')
            ->all();

        DB::table('merchandising_pins')
            ->whereNotIn('section_id', $keepIds === [] ? [0] : $keepIds)
            ->delete();

        DB::table('merchandising_sections')
            ->whereNotIn('id', $keepIds === [] ? [0] : $keepIds)
            ->delete();

        // Ensure every slug×audience exists even if templates were missing.
        foreach ($defaults as $slug => [$titleIt, $titleEn]) {
            foreach ($this->audiences as $audience) {
                $exists = DB::table('merchandising_sections')
                    ->where('slug', $slug)
                    ->where('audience', $audience)
                    ->exists();
                if ($exists) {
                    continue;
                }
                DB::table('merchandising_sections')->insert([
                    'slug' => $slug,
                    'title_it' => $titleIt,
                    'title_en' => $titleEn,
                    'audience' => $audience,
                    'max_items' => 12,
                    'rules' => null,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        Schema::table('merchandising_sections', function (Blueprint $table) {
            $table->unique(['slug', 'audience'], 'merchandising_sections_slug_audience_unique');
        });
    }

    public function down(): void
    {
        Schema::table('merchandising_sections', function (Blueprint $table) {
            $table->dropUnique('merchandising_sections_slug_audience_unique');
        });

        DB::table('merchandising_sections')
            ->where('audience', '!=', 'women')
            ->delete();

        DB::table('merchandising_sections')->update(['audience' => null]);

        Schema::table('merchandising_sections', function (Blueprint $table) {
            $table->unique('slug');
        });
    }
};
