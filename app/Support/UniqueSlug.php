<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class UniqueSlug
{
    public static function make(string $source, string $table, string $locale, ?int $ignoreId = null): string
    {
        $base = Str::slug($source);
        if ($base === '') {
            $base = 'item';
        }

        $slug = $base;
        $n = 2;

        while (self::exists($table, $locale, $slug, $ignoreId)) {
            $slug = $base.'-'.$n;
            $n++;
        }

        return $slug;
    }

    private static function exists(string $table, string $locale, string $slug, ?int $ignoreId): bool
    {
        $query = DB::table($table)
            ->where('locale', $locale)
            ->where('slug', $slug);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }
}
