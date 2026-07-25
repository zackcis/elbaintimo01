<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $variants = $this->input('variants');
        if (! is_array($variants)) {
            return;
        }
        foreach ($variants as $i => $row) {
            if (! is_array($row)) {
                continue;
            }
            $hex = $row['color_hex'] ?? null;
            if (! is_string($hex)) {
                $variants[$i]['color_hex'] = null;

                continue;
            }
            $trimmed = trim($hex);
            if ($trimmed === '') {
                $variants[$i]['color_hex'] = null;
            } elseif (preg_match('/^#([A-Fa-f0-9]{6})$/', $trimmed)) {
                $variants[$i]['color_hex'] = strtoupper($trimmed);
            } else {
                $variants[$i]['color_hex'] = $trimmed;
            }

            $compareAt = $row['compare_at_price'] ?? null;
            if ($compareAt === null || $compareAt === '') {
                $variants[$i]['compare_at_price'] = null;
            }
        }
        $this->merge(['variants' => $variants]);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title.it' => ['required', 'string', 'max:255'],
            'title.en' => ['required', 'string', 'max:255'],
            'description.it' => ['nullable', 'string'],
            'description.en' => ['nullable', 'string'],
            'care_notes.it' => ['nullable', 'string'],
            'care_notes.en' => ['nullable', 'string'],
            'fit_notes.it' => ['nullable', 'string'],
            'fit_notes.en' => ['nullable', 'string'],
            'related_product_ids' => ['nullable', 'array', 'max:12'],
            'related_product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'tissu' => ['nullable', 'string', 'max:255'],
            'is_published' => ['sometimes', 'boolean'],
            'new_brand_name.it' => ['nullable', 'string', 'max:255'],
            'new_brand_name.en' => ['nullable', 'string', 'max:255'],
            'new_brand_logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.size' => ['nullable', 'string', 'max:255'],
            'variants.*.color' => ['required', 'string', 'max:255'],
            'variants.*.color_hex' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'variants.*.price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'variants.*.compare_at_price' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
            'images' => ['nullable', 'array'],
            'images.*.file' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'images.*.path' => ['nullable', 'string'],
            'images.*.is_primary' => ['boolean'],
            'images.*.position' => ['integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->filled('brand_id')) {
                $it = $this->input('new_brand_name.it');
                $en = $this->input('new_brand_name.en');
                if ((filled($it) || filled($en)) && (! filled($it) || ! filled($en))) {
                    $v->errors()->add(
                        'new_brand_name.it',
                        'Italian and English brand names are both required when adding a new brand.',
                    );
                }
            }

            $ids = $this->input('related_product_ids', []);
            if (is_array($ids)) {
                $productId = $this->route('product');
                $currentId = is_object($productId) ? (int) $productId->id : (int) $productId;
                foreach ($ids as $i => $id) {
                    if ((int) $id === $currentId) {
                        $v->errors()->add(
                            "related_product_ids.{$i}",
                            'A product cannot be related to itself.',
                        );
                    }
                }
            }

            $variants = $this->input('variants', []);
            if (! is_array($variants)) {
                return;
            }
            foreach ($variants as $i => $row) {
                if (! is_array($row)) {
                    continue;
                }
                $compareAt = $row['compare_at_price'] ?? null;
                if ($compareAt === null || $compareAt === '') {
                    continue;
                }
                $price = $row['price'] ?? null;
                if (! is_numeric($price) || ! is_numeric($compareAt)) {
                    continue;
                }
                if ((float) $compareAt <= (float) $price) {
                    $v->errors()->add(
                        "variants.{$i}.compare_at_price",
                        'Was price must be higher than the selling price to show a discount.',
                    );
                }
            }
        });
    }
}
