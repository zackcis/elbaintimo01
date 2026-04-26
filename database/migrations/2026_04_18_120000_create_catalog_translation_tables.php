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
        Schema::create('product_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 8);
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->unique(['product_id', 'locale']);
        });

        Schema::create('category_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 8);
            $table->string('name');
            $table->timestamps();
            $table->unique(['category_id', 'locale']);
        });

        Schema::create('brand_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 8);
            $table->string('name');
            $table->timestamps();
            $table->unique(['brand_id', 'locale']);
        });

        $now = now();
        $locales = ['it', 'en'];

        foreach (DB::table('products')->orderBy('id')->cursor() as $row) {
            foreach ($locales as $locale) {
                DB::table('product_translations')->insert([
                    'product_id' => $row->id,
                    'locale' => $locale,
                    'title' => $row->title,
                    'description' => $row->description,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        foreach (DB::table('categories')->orderBy('id')->cursor() as $row) {
            foreach ($locales as $locale) {
                DB::table('category_translations')->insert([
                    'category_id' => $row->id,
                    'locale' => $locale,
                    'name' => $row->name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        foreach (DB::table('brands')->orderBy('id')->cursor() as $row) {
            foreach ($locales as $locale) {
                DB::table('brand_translations')->insert([
                    'brand_id' => $row->id,
                    'locale' => $locale,
                    'name' => $row->name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['title', 'description']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('name');
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('title')->nullable();
            $table->text('description')->nullable();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->string('name')->nullable();
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->string('name')->nullable();
        });

        foreach (DB::table('products')->orderBy('id')->cursor() as $row) {
            $t = DB::table('product_translations')
                ->where('product_id', $row->id)
                ->where('locale', 'it')
                ->first();
            DB::table('products')->where('id', $row->id)->update([
                'title' => $t->title ?? '',
                'description' => $t->description ?? null,
            ]);
        }

        foreach (DB::table('categories')->orderBy('id')->cursor() as $row) {
            $t = DB::table('category_translations')
                ->where('category_id', $row->id)
                ->where('locale', 'it')
                ->first();
            DB::table('categories')->where('id', $row->id)->update([
                'name' => $t->name ?? '',
            ]);
        }

        foreach (DB::table('brands')->orderBy('id')->cursor() as $row) {
            $t = DB::table('brand_translations')
                ->where('brand_id', $row->id)
                ->where('locale', 'it')
                ->first();
            DB::table('brands')->where('id', $row->id)->update([
                'name' => $t->name ?? '',
            ]);
        }

        Schema::dropIfExists('brand_translations');
        Schema::dropIfExists('category_translations');
        Schema::dropIfExists('product_translations');
    }
};
