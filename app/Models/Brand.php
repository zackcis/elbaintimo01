<?php

namespace App\Models;

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

    public function nameForLocale(string $locale): string
    {
        if ($this->relationLoaded('translations')) {
            return (string) ($this->translations->firstWhere('locale', $locale)?->name ?? '');
        }

        return (string) ($this->translations()->where('locale', $locale)->value('name') ?? '');
    }

    public function getNameAttribute(): string
    {
        return $this->nameForLocale((string) config('harimi.admin_list_locale', 'it'));
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
