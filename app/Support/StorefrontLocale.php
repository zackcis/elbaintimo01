<?php

namespace App\Support;

final class StorefrontLocale
{
    public static function fallback(): string
    {
        return (string) config('harimi.public_default_locale', 'it');
    }

    /**
     * @return list<string>
     */
    public static function supported(): array
    {
        return config('harimi.locales', ['it', 'en']);
    }

    public static function resolve(?string $requested): string
    {
        if (is_string($requested) && in_array($requested, self::supported(), true)) {
            return $requested;
        }

        return self::fallback();
    }
}
