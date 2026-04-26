<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $routeLocale = $request->route('locale');
        $currentLocale = is_string($routeLocale) && in_array($routeLocale, config('harimi.locales', ['it', 'en']), true)
            ? $routeLocale
            : config('harimi.public_default_locale', 'it');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'harimi' => [
                'locales' => config('harimi.locales', ['it', 'en']),
                'adminListLocale' => config('harimi.admin_list_locale', 'it'),
                'publicDefaultLocale' => config('harimi.public_default_locale', 'it'),
                'currentLocale' => $currentLocale,
            ],
            'ui' => fn () => $this->loadUiDictionary($currentLocale),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role ?? 'staff',
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function loadUiDictionary(string $locale): array
    {
        $path = lang_path($locale.'/ui.json');
        if (! is_file($path)) {
            $path = lang_path('en/ui.json');
        }

        if (! is_file($path)) {
            return [];
        }

        $decoded = json_decode(File::get($path), true);

        return is_array($decoded) ? $decoded : [];
    }
}
