<?php

use App\Enums\MerchandisingShelf;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchandising_sections', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 64)->unique();
            $table->string('title_it');
            $table->string('title_en');
            $table->string('audience', 16)->nullable();
            $table->unsignedInteger('max_items')->default(12);
            $table->json('rules')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('merchandising_pins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('merchandising_sections')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->string('mode', 16)->default('include');
            $table->timestamps();

            $table->unique(['section_id', 'product_id']);
            $table->index(['section_id', 'position']);
        });

        $defaults = [
            MerchandisingShelf::BestSellers->value => ['Best seller', 'Best sellers'],
            MerchandisingShelf::NewArrivals->value => ['Novità', 'New arrivals'],
            MerchandisingShelf::Featured->value => ['In evidenza', 'Featured'],
            MerchandisingShelf::SpecialOffers->value => ['Offerte speciali', 'Special offers'],
        ];

        $now = now();
        foreach ($defaults as $slug => [$titleIt, $titleEn]) {
            DB::table('merchandising_sections')->insert([
                'slug' => $slug,
                'title_it' => $titleIt,
                'title_en' => $titleEn,
                'audience' => null,
                'max_items' => 12,
                'rules' => null,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        if (Schema::hasTable('merchandising_items')) {
            $sections = DB::table('merchandising_sections')->pluck('id', 'slug');
            $items = DB::table('merchandising_items')->orderBy('position')->orderBy('id')->get();

            foreach ($items as $item) {
                $sectionId = $sections[$item->shelf] ?? null;
                if ($sectionId === null) {
                    continue;
                }

                DB::table('merchandising_pins')->insertOrIgnore([
                    'section_id' => $sectionId,
                    'product_id' => $item->product_id,
                    'position' => (int) $item->position,
                    'mode' => 'include',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('merchandising_pins');
        Schema::dropIfExists('merchandising_sections');
    }
};
