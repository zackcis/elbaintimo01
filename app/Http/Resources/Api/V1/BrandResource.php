<?php

namespace App\Http\Resources\Api\V1;

use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Brand
 */
class BrandResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $locale = (string) ($request->attributes->get('storefront_locale') ?? app('storefront.locale'));

        return [
            'id' => $this->id,
            'slug' => $this->slugForLocale($locale),
            'name' => $this->nameForLocale($locale),
            'logo_url' => MediaUrl::fromPath($this->logo),
            'hero_url' => MediaUrl::fromPath($this->hero_path),
            'products_count' => (int) ($this->products_count ?? 0),
        ];
    }
}
