<?php

namespace App\Http\Responses\Fortify;

use App\Support\CurrentLocale;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;

class LogoutResponse implements LogoutResponseContract
{
    public function toResponse($request)
    {
        return $request->wantsJson()
            ? new JsonResponse('', 204)
            : redirect()->route('storefront.home', ['locale' => CurrentLocale::from($request)]);
    }
}
