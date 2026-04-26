<?php

namespace App\Http\Responses\Fortify;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\PasswordResetResponse as PasswordResetResponseContract;

class PasswordResetResponse implements PasswordResetResponseContract
{
    public function __construct(
        protected string $status
    ) {}

    public function toResponse($request)
    {
        $redirectUrl = config('fortify.views', true)
            ? route('login')
            : route('storefront.home', ['locale' => \App\Support\CurrentLocale::from($request)]);

        return $request->wantsJson()
            ? new JsonResponse(['message' => trans($this->status)], 200)
            : redirect($redirectUrl)->with('status', trans($this->status));
    }
}
