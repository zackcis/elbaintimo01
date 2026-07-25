<?php

namespace App\Models;

use App\Support\StorefrontLocale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'is_published',
        'published_at',
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

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

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

    public function merchandisingItems(): HasMany
    {
        return $this->hasMany(MerchandisingItem::class);
    }

    public function merchandisingPins(): HasMany
    {
        return $this->hasMany(MerchandisingPin::class);
    }

    public function relatedProducts(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'product_related',
            'product_id',
            'related_product_id',
        )->withPivot('position')
            ->withTimestamps()
            ->orderByPivot('position');
    }

    public function careNotesForLocale(string $locale): ?string
    {
        return $this->translationFor($locale)?->care_notes;
    }

    public function fitNotesForLocale(string $locale): ?string
    {
        return $this->translationFor($locale)?->fit_notes;
    }

    public function translationFor(string $locale): ?ProductTranslation
    {
        $translations = $this->relationLoaded('translations')
            ? $this->translations
            : $this->translations()->get();

        return $translations->firstWhere('locale', $locale)
            ?? $translations->firstWhere('locale', StorefrontLocale::fallback());
    }

    public function titleForLocale(string $locale): string
    {
        return (string) ($this->translationFor($locale)?->title ?? '');
    }

    public function descriptionForLocale(string $locale): ?string
    {
        return $this->translationFor($locale)?->description;
    }

    public function slugForLocale(string $locale): string
    {
        return (string) ($this->translationFor($locale)?->slug ?? '');
    }

    public function getTitleAttribute(): string
    {
        return $this->titleForLocale((string) config('harimi.admin_list_locale', 'it'));
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->descriptionForLocale((string) config('harimi.admin_list_locale', 'it'));
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeWhereStorefrontSlug(Builder $query, string $slug, string $locale): Builder
    {
        $fallback = StorefrontLocale::fallback();

        $productId = ProductTranslation::query()
            ->where('slug', $slug)
            ->where('locale', $locale)
            ->value('product_id');

        if ($productId === null && $locale !== $fallback) {
            $productId = ProductTranslation::query()
                ->where('slug', $slug)
                ->where('locale', $fallback)
                ->value('product_id');
        }

        return $query->where('id', $productId ?? 0);
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
