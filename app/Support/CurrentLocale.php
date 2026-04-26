<?php

namespace App\Support;

use Illuminate\Http\Request;

final class CurrentLocale
{
    public static function from(Request $request): string
    {
        $locale = $request->route('locale');

        if (is_string($locale) && in_array($locale, config('harimi.locales', ['it', 'en']), true)) {
            return $locale;
        }

        return config('harimi.public_default_locale', 'it');
    }
}
