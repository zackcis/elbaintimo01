<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('color_it')->nullable()->after('color');
            $table->string('color_en')->nullable()->after('color_it');
        });

        DB::table('product_variants')
            ->whereNotNull('color')
            ->where('color', '!=', '')
            ->orderBy('id')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('product_variants')->where('id', $row->id)->update([
                        'color_it' => $row->color_it ?: $row->color,
                        'color_en' => $row->color_en ?: $row->color,
                    ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['color_it', 'color_en']);
        });
    }
};
