<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteMedia;
use App\Support\MediaUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteMediaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locale = (string) $request->attributes->get('storefront_locale');
        $rows = SiteMedia::query()->whereNotNull('path')->get();

        $data = [];
        foreach (SiteMedia::audiences() as $audience) {
            $data[$audience] = [];
            foreach (SiteMedia::keys() as $key) {
                $row = $rows->first(
                    fn (SiteMedia $m) => $m->key === $key && $m->audience === $audience
                );
                $data[$audience][$key] = MediaUrl::fromPath($row?->path);
            }
        }

        return response()->json([
            'data' => $data,
            'meta' => ['locale' => $locale],
        ]);
    }
}
