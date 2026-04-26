<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'category_id',
        'brand_id',
        'tissu',
    ];

    /**
     * Accessor-backed fields for admin UI / Inertia JSON (no `title` / `description` columns).
     *
     * @var list<string>
     */
    protected $appends = [
        'title',
        'description',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ProductTranslation::class);
    }

    public function titleForLocale(string $locale): string
    {
        if ($this->relationLoaded('translations')) {
            return (string) ($this->translations->firstWhere('locale', $locale)?->title ?? '');
        }

        return (string) ($this->translations()->where('locale', $locale)->value('title') ?? '');
    }

    public function descriptionForLocale(string $locale): ?string
    {
        if ($this->relationLoaded('translations')) {
            return $this->translations->firstWhere('locale', $locale)?->description;
        }

        return $this->translations()->where('locale', $locale)->value('description');
    }

    public function getTitleAttribute(): string
    {
        return $this->titleForLocale((string) config('harimi.admin_list_locale', 'it'));
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->descriptionForLocale((string) config('harimi.admin_list_locale', 'it'));
    }

    public function scopeAdminOrderByTitle(Builder $query): Builder
    {
        $locale = (string) config('harimi.admin_list_locale', 'it');
        $alias = 'pt_admin_sort';

        return $query
            ->join('product_translations as '.$alias, function ($join) use ($locale, $alias) {
                $join->on('products.id', '=', $alias.'.product_id')
                    ->where($alias.'.locale', '=', $locale);
            })
            ->orderBy($alias.'.title')
            ->select('products.*');
    }
}
