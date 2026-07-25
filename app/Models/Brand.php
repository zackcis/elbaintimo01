<?php

namespace App\Models;

use App\Support\StorefrontLocale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Brand extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'logo',
        'hero_path',
    ];

    /**
     * Accessor-backed label for admin UI / Inertia JSON (no `name` column).
     *
     * @var list<string>
     */
    protected $appends = [
        'name',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(BrandTranslation::class);
    }

    public function translationFor(string $locale): ?BrandTranslation
    {
        $translations = $this->relationLoaded('translations')
            ? $this->translations
            : $this->translations()->get();

        return $translations->firstWhere('locale', $locale)
            ?? $translations->firstWhere('locale', StorefrontLocale::fallback());
    }

    public function nameForLocale(string $locale): string
    {
        return (string) ($this->translationFor($locale)?->name ?? '');
    }

    public function slugForLocale(string $locale): string
    {
        return (string) ($this->translationFor($locale)?->slug ?? '');
    }

    public function getNameAttribute(): string
    {
        return $this->nameForLocale((string) config('harimi.admin_list_locale', 'it'));
    }

    public function scopeWhereStorefrontSlug(Builder $query, string $slug, string $locale): Builder
    {
        $fallback = StorefrontLocale::fallback();

        $brandId = BrandTranslation::query()
            ->where('slug', $slug)
            ->where('locale', $locale)
            ->value('brand_id');

        if ($brandId === null && $locale !== $fallback) {
            $brandId = BrandTranslation::query()
                ->where('slug', $slug)
                ->where('locale', $fallback)
                ->value('brand_id');
        }

        return $query->where('id', $brandId ?? 0);
    }

    public function scopeAdminOrderByName(Builder $query): Builder
    {
        $locale = (string) config('harimi.admin_list_locale', 'it');
        $alias = 'bt_admin_sort';

        return $query
            ->join('brand_translations as '.$alias, function ($join) use ($locale, $alias) {
                $join->on('brands.id', '=', $alias.'.brand_id')
                    ->where($alias.'.locale', '=', $locale);
            })
            ->orderBy($alias.'.name')
            ->select('brands.*');
    }
}
