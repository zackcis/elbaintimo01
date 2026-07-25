<?php

namespace App\Http\Middleware;

use App\Support\StorefrontLocale;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetStorefrontLocale
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = StorefrontLocale::resolve($request->query('locale'));
        $request->attributes->set('storefront_locale', $locale);
        app()->instance('storefront.locale', $locale);

        return $next($request);
    }
}
