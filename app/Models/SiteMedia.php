<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteMedia extends Model
{
    protected $table = 'site_media';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'audience',
        'path',
    ];

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return [
            'welcome',
            'home_still',
            'home_video_mp4',
            'home_video_webm',
            'new_arrivals_still',
            ...self::instagramKeys(),
        ];
    }

    /**
     * Home “Follow us on Instagram” collage tiles (per audience).
     *
     * @return list<string>
     */
    public static function instagramKeys(): array
    {
        return [
            'instagram_1',
            'instagram_2',
            'instagram_3',
            'instagram_4',
            'instagram_5',
            'instagram_6',
        ];
    }

    public static function isStillImageKey(string $key): bool
    {
        return in_array($key, ['welcome', 'home_still', 'new_arrivals_still'], true)
            || in_array($key, self::instagramKeys(), true);
    }

    /**
     * @return list<string>
     */
    public static function audiences(): array
    {
        return ['women', 'men', 'kids'];
    }
}
