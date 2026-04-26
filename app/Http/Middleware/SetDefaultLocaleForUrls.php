<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures route() calls include a default locale before SetLocaleFromUrl runs.
 */
class SetDefaultLocaleForUrls
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->route('locale');

        if (is_string($locale) && in_array($locale, config('harimi.locales', ['it', 'en']), true)) {
            URL::defaults(['locale' => $locale]);
        } else {
            URL::defaults(['locale' => config('harimi.public_default_locale', 'it')]);
        }

        return $next($request);
    }
}
