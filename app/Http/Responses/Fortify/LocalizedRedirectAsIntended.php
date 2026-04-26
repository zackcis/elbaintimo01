<?php

namespace App\Http\Responses\Fortify;

use Illuminate\Contracts\Support\Responsable;

/**
 * Fortify's RedirectAsIntended uses config('fortify.home') which is a static path.
 * Dashboard lives under /{locale}/dashboard — always resolve the named route.
 */
class LocalizedRedirectAsIntended implements Responsable
{
    public function __construct(public string $name) {}

    public function toResponse($request)
    {
        return redirect()->intended(route('dashboard'));
    }
}
