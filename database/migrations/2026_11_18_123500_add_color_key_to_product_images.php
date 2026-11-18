<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->string('color_key')->nullable()->after('path');
            $table->index(['product_id', 'color_key'], 'product_images_product_id_color_key_index');
        });
    }

    public function down(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->dropIndex('product_images_product_id_color_key_index');
            $table->dropColumn('color_key');
        });
    }
};
