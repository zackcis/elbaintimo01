<?php

namespace App\Http\Requests\Api\V1\Checkout;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutPreviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'distinct', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'shipping_address' => ['nullable', 'array'],
            'shipping_address.country' => ['nullable', 'string', 'size:2'],
            'shipping_address.postal_code' => ['nullable', 'string', 'max:32'],
            'shipping_address.city' => ['nullable', 'string', 'max:255'],
            'shipping_address.province' => ['nullable', 'string', 'max:16'],
        ];
    }
}
