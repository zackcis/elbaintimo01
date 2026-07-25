<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_published')->default(false)->after('tissu');
            $table->timestamp('published_at')->nullable()->after('is_published');
            $table->index('is_published');
        });

        Schema::table('product_translations', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('locale');
        });

        Schema::table('category_translations', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('locale');
        });

        Schema::table('brand_translations', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('locale');
        });

        $this->backfillProductSlugsAndPublish();
        $this->backfillCategorySlugs();
        $this->backfillBrandSlugs();

        Schema::table('product_translations', function (Blueprint $table) {
            $table->unique(['locale', 'slug']);
        });

        Schema::table('category_translations', function (Blueprint $table) {
            $table->unique(['locale', 'slug']);
        });

        Schema::table('brand_translations', function (Blueprint $table) {
            $table->unique(['locale', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::table('product_translations', function (Blueprint $table) {
            $table->dropUnique(['locale', 'slug']);
            $table->dropColumn('slug');
        });

        Schema::table('category_translations', function (Blueprint $table) {
            $table->dropUnique(['locale', 'slug']);
            $table->dropColumn('slug');
        });

        Schema::table('brand_translations', function (Blueprint $table) {
            $table->dropUnique(['locale', 'slug']);
            $table->dropColumn('slug');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_published']);
            $table->dropColumn(['is_published', 'published_at']);
        });
    }

    private function backfillProductSlugsAndPublish(): void
    {
        $used = [];

        foreach (DB::table('product_translations')->orderBy('id')->cursor() as $row) {
            $base = Str::slug((string) $row->title);
            if ($base === '') {
                $base = 'product-'.$row->product_id;
            }

            $slug = $base;
            $key = $row->locale.'|'.$slug;
            $n = 2;
            while (isset($used[$key])) {
                $slug = $base.'-'.$n;
                $key = $row->locale.'|'.$slug;
                $n++;
            }
            $used[$key] = true;

            DB::table('product_translations')->where('id', $row->id)->update(['slug' => $slug]);
        }

        DB::table('products')->update([
            'is_published' => true,
            'published_at' => now(),
        ]);
    }

    private function backfillCategorySlugs(): void
    {
        $used = [];

        foreach (DB::table('category_translations')->orderBy('id')->cursor() as $row) {
            $base = Str::slug((string) $row->name);
            if ($base === '') {
                $base = 'category-'.$row->category_id;
            }

            $slug = $base;
            $key = $row->locale.'|'.$slug;
            $n = 2;
            while (isset($used[$key])) {
                $slug = $base.'-'.$n;
                $key = $row->locale.'|'.$slug;
                $n++;
            }
            $used[$key] = true;

            DB::table('category_translations')->where('id', $row->id)->update(['slug' => $slug]);
        }
    }

    private function backfillBrandSlugs(): void
    {
        $used = [];

        foreach (DB::table('brand_translations')->orderBy('id')->cursor() as $row) {
            $base = Str::slug((string) $row->name);
            if ($base === '') {
                $base = 'brand-'.$row->brand_id;
            }

            $slug = $base;
            $key = $row->locale.'|'.$slug;
            $n = 2;
            while (isset($used[$key])) {
                $slug = $base.'-'.$n;
                $key = $row->locale.'|'.$slug;
                $n++;
            }
            $used[$key] = true;

            DB::table('brand_translations')->where('id', $row->id)->update(['slug' => $slug]);
        }
    }
};
