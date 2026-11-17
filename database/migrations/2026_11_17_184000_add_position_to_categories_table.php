<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedInteger('position')->default(0);
            $table->index(['parent_id', 'position'], 'categories_parent_id_position_index');
        });

        $locale = (string) config('harimi.admin_list_locale', 'it');
        $fallback = 'it';

        $categories = DB::table('categories')->orderBy('id')->get(['id', 'parent_id']);
        $names = DB::table('category_translations')
            ->whereIn('locale', array_unique([$locale, $fallback]))
            ->get(['category_id', 'locale', 'name'])
            ->groupBy('category_id');

        $grouped = [];
        foreach ($categories as $row) {
            $key = $row->parent_id === null ? 'root' : (string) $row->parent_id;
            $translations = $names->get($row->id);
            $name = '';
            if ($translations) {
                $preferred = $translations->firstWhere('locale', $locale)
                    ?? $translations->firstWhere('locale', $fallback)
                    ?? $translations->first();
                $name = (string) ($preferred->name ?? '');
            }
            $grouped[$key][] = [
                'id' => (int) $row->id,
                'name' => $name,
            ];
        }

        foreach ($grouped as $siblings) {
            usort($siblings, function (array $a, array $b): int {
                $byName = strnatcasecmp($a['name'], $b['name']);
                if ($byName !== 0) {
                    return $byName;
                }

                return $a['id'] <=> $b['id'];
            });

            foreach (array_values($siblings) as $position => $sibling) {
                DB::table('categories')
                    ->where('id', $sibling['id'])
                    ->update(['position' => $position]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex('categories_parent_id_position_index');
            $table->dropColumn('position');
        });
    }
};
