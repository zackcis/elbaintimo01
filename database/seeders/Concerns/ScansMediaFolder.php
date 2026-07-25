<?php

namespace Database\Seeders\Concerns;

use Illuminate\Support\Facades\Storage;

trait ScansMediaFolder
{
    /**
     * Return every image file inside a folder of the public disk as relative
     * paths (e.g. "products/abc.jpg"), ready to be stored on a model.
     *
     * @return list<string>
     */
    protected function mediaFiles(string $folder): array
    {
        $disk = Storage::disk('public');

        if (! $disk->exists($folder)) {
            return [];
        }

        return collect($disk->files($folder))
            ->filter(fn (string $file) => preg_match('/\.(jpe?g|png|webp)$/i', $file) === 1)
            ->values()
            ->all();
    }

    /**
     * Pick up to $count distinct random paths from a pool.
     *
     * @param  list<string>  $pool
     * @return list<string>
     */
    protected function pickImages(array $pool, int $count): array
    {
        if ($pool === []) {
            return [];
        }

        shuffle($pool);

        return array_slice($pool, 0, min($count, count($pool)));
    }

    /**
     * Pick a single random path from a pool (with fallback pool), or null.
     *
     * @param  list<string>  $pool
     * @param  list<string>  $fallback
     */
    protected function pickOneImage(array $pool, array $fallback = []): ?string
    {
        $source = $pool !== [] ? $pool : $fallback;

        if ($source === []) {
            return null;
        }

        return $source[array_rand($source)];
    }
}
