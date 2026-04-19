<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Category extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'parent_id',
    ];

    /**
     * Get the parent category.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * Get the child categories.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /**
     * Get the products for the category.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the images for the category.
     */
    public function images(): HasMany
    {
        return $this->hasMany(CategoryImage::class);
    }

    /**
     * All category IDs in this node's subtree (not including the node itself).
     *
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
     * Flat options for a parent select: tree order, indented labels.
     * When editing, pass the category id to exclude itself and its descendants (no cycles).
     *
     * @return list<array{id: int, label: string}>
     */
    public static function parentSelectOptions(?int $excludeCategoryId = null): array
    {
        $exclude = [];
        if ($excludeCategoryId !== null) {
            $exclude = array_merge([$excludeCategoryId], static::descendantIds($excludeCategoryId));
        }
        $excludeSet = array_flip($exclude);

        $categories = static::query()->orderBy('name')->get(['id', 'name', 'parent_id']);

        $byParent = [];
        foreach ($categories as $c) {
            $pid = $c->parent_id ?? 0;
            $byParent[$pid][] = $c;
        }
        foreach ($byParent as &$list) {
            usort($list, fn (self $a, self $b) => strcmp($a->name, $b->name));
        }
        unset($list);

        $options = [];
        $walk = function (int $parentId, int $depth) use (&$walk, &$options, $byParent, $excludeSet): void {
            foreach ($byParent[$parentId] ?? [] as $cat) {
                if (isset($excludeSet[$cat->id])) {
                    continue;
                }
                $options[] = [
                    'id' => (int) $cat->id,
                    'label' => str_repeat('— ', $depth).$cat->name,
                ];
                $walk((int) $cat->id, $depth + 1);
            }
        };
        $walk(0, 0);

        return $options;
    }

    /**
     * Build a nested array of categories for trees (e.g. admin index).
     *
     * @return list<array<string, mixed>>
     */
    public static function nestedTree(Collection $all, ?int $parentId = null): array
    {
        return $all
            ->filter(fn (self $c) => $c->parent_id === $parentId)
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->map(function (self $cat) use ($all) {
                $parentMeta = null;
                if ($cat->parent_id !== null) {
                    $parentRow = $all->firstWhere('id', $cat->parent_id);
                    $parentMeta = [
                        'id' => $cat->parent_id,
                        'name' => $parentRow ? (string) $parentRow->name : '',
                    ];
                }

                return [
                    'id' => $cat->id,
                    'name' => $cat->name,
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
}
