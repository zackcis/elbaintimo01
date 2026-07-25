<?php

namespace App\Http\Requests\Api\V1\Checkout;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreCheckoutOrderRequest extends FormRequest
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
            'customer' => ['required', 'array'],
            'customer.name' => ['required', 'string', 'max:255'],
            'customer.email' => ['required', 'email', 'max:255'],
            'customer.phone' => ['required', 'string', 'max:50'],
            'shipping_address' => ['required', 'array'],
            'shipping_address.line1' => ['required', 'string', 'max:255'],
            'shipping_address.line2' => ['nullable', 'string', 'max:255'],
            'shipping_address.city' => ['required', 'string', 'max:255'],
            'shipping_address.province' => ['required', 'string', 'max:16'],
            'shipping_address.postal_code' => ['required', 'string', 'max:32'],
            'shipping_address.country' => ['required', 'string', 'size:2'],
            'billing_same_as_shipping' => ['sometimes', 'boolean'],
            'billing_address' => ['nullable', 'array'],
            'billing_address.line1' => ['required_if:billing_same_as_shipping,false', 'nullable', 'string', 'max:255'],
            'billing_address.line2' => ['nullable', 'string', 'max:255'],
            'billing_address.city' => ['required_if:billing_same_as_shipping,false', 'nullable', 'string', 'max:255'],
            'billing_address.province' => ['required_if:billing_same_as_shipping,false', 'nullable', 'string', 'max:16'],
            'billing_address.postal_code' => ['required_if:billing_same_as_shipping,false', 'nullable', 'string', 'max:32'],
            'billing_address.country' => ['required_if:billing_same_as_shipping,false', 'nullable', 'string', 'size:2'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'distinct', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'idempotency_key' => ['nullable', 'string', 'max:64'],
            'success_url' => ['required', 'string', 'max:2048'],
            'cancel_url' => ['required', 'string', 'max:2048'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $same = $this->boolean('billing_same_as_shipping', true);
            if (! $same && ! is_array($this->input('billing_address'))) {
                $v->errors()->add('billing_address', 'Billing address is required when billing_same_as_shipping is false.');
            }
        });
    }
}
