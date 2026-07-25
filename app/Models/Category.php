<?php

namespace App\Models;

use App\Support\StorefrontLocale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Category extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'parent_id',
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

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(CategoryImage::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(CategoryTranslation::class);
    }

    public function translationFor(string $locale): ?CategoryTranslation
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

        $categoryId = CategoryTranslation::query()
            ->where('slug', $slug)
            ->where('locale', $locale)
            ->value('category_id');

        if ($categoryId === null && $locale !== $fallback) {
            $categoryId = CategoryTranslation::query()
                ->where('slug', $slug)
                ->where('locale', $fallback)
                ->value('category_id');
        }

        return $query->where('id', $categoryId ?? 0);
    }

    /**
     * @return list<int>
     */
    public static function descendantIds(int $categoryId): array
    {
        $rows = static::query()->get(['id', 'parent_id']);
        $byParent = [];
        foreach ($rows as $row) {
            $pid = $row->parent_id ?? 0;
            $byParent[$pid][] = (int) $row->id;
        }

        $result = [];
        $queue = $byParent[$categoryId] ?? [];
        while ($queue !== []) {
            $id = array_shift($queue);
            $result[] = $id;
            foreach ($byParent[$id] ?? [] as $childId) {
                $queue[] = $childId;
            }
        }

        return $result;
    }

    /**
     * @return list<array{id: int, label: string}>
     */
    public static function parentSelectOptions(?int $excludeCategoryId = null): array
    {
        $exclude = [];
        if ($excludeCategoryId !== null) {
            $exclude = array_merge([$excludeCategoryId], static::descendantIds($excludeCategoryId));
        }
        $excludeSet = array_flip($exclude);

        $locale = (string) config('harimi.admin_list_locale', 'it');

        $categories = static::query()
            ->with('translations')
            ->get(['id', 'parent_id']);

        $byParent = [];
        foreach ($categories as $c) {
            $pid = $c->parent_id ?? 0;
            $byParent[$pid][] = $c;
        }
        foreach ($byParent as &$list) {
            usort($list, fn (self $a, self $b) => strcmp($a->nameForLocale($locale), $b->nameForLocale($locale)));
        }
        unset($list);

        $options = [];
        $walk = function (int $parentId, int $depth) use (&$walk, &$options, $byParent, $excludeSet, $locale): void {
            foreach ($byParent[$parentId] ?? [] as $cat) {
                if (isset($excludeSet[$cat->id])) {
                    continue;
                }
                $options[] = [
                    'id' => (int) $cat->id,
                    'label' => str_repeat('— ', $depth).$cat->nameForLocale($locale),
                ];
                $walk((int) $cat->id, $depth + 1);
            }
        };
        $walk(0, 0);

        return $options;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function nestedTree(Collection $all, ?int $parentId = null): array
    {
        $locale = (string) config('harimi.admin_list_locale', 'it');

        return $all
            ->filter(fn (self $c) => $c->parent_id === $parentId)
            ->sortBy(fn (self $c) => $c->nameForLocale($locale), SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->map(function (self $cat) use ($all, $locale) {
                $parentMeta = null;
                if ($cat->parent_id !== null) {
                    $parentRow = $all->firstWhere('id', $cat->parent_id);
                    $parentMeta = [
                        'id' => $cat->parent_id,
                        'name' => $parentRow ? $parentRow->nameForLocale($locale) : '',
                    ];
                }

                return [
                    'id' => $cat->id,
                    'name' => $cat->nameForLocale($locale),
                    'parent_id' => $cat->parent_id,
                    'parent' => $parentMeta,
                    'images' => $cat->images,
                    'products_count' => (int) ($cat->products_count ?? 0),
                    'children' => static::nestedTree($all, $cat->id),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function storefrontTree(Collection $all, string $locale, ?int $parentId = null): array
    {
        return $all
            ->filter(fn (self $c) => $c->parent_id === $parentId)
            ->sortBy(fn (self $c) => $c->nameForLocale($locale), SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->map(function (self $cat) use ($all, $locale) {
                $image = $cat->relationLoaded('images')
                    ? $cat->images->first()
                    : null;

                return [
                    'id' => $cat->id,
                    'slug' => $cat->slugForLocale($locale),
                    'name' => $cat->nameForLocale($locale),
                    'parent_id' => $cat->parent_id,
                    'image_url' => $image ? \App\Support\MediaUrl::fromPath($image->path) : null,
                    'hero_url' => \App\Support\MediaUrl::fromPath($cat->hero_path),
                    'children' => static::storefrontTree($all, $locale, $cat->id),
                ];
            })
            ->values()
            ->all();
    }
}
