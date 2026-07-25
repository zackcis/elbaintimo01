<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_media', function (Blueprint $table) {
            $table->id();
            $table->string('key', 64);
            $table->string('audience', 16)->nullable();
            $table->string('path')->nullable();
            $table->timestamps();

            $table->unique(['key', 'audience']);
            $table->index('key');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->string('hero_path')->nullable()->after('parent_id');
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->string('hero_path')->nullable()->after('logo');
        });
    }

    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->dropColumn('hero_path');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('hero_path');
        });

        Schema::dropIfExists('site_media');
    }
};
