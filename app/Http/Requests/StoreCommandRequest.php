<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommandRequest extends FormRequest
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
            'client_mode' => ['required', 'string', 'in:existing,new'],
            'client_user_id' => [
                'prohibited_if:client_mode,new',
                Rule::requiredIf(fn () => $this->input('client_mode') === 'existing'),
                'integer',
                Rule::exists('users', 'id')->where(fn ($q) => $q->where('role', 'client')),
            ],
            'new_client_name' => ['prohibited_if:client_mode,existing', 'required_if:client_mode,new', 'string', 'max:255'],
            'new_client_email' => ['prohibited_if:client_mode,existing', 'required_if:client_mode,new', 'email', 'max:255', Rule::unique('users', 'email')],
            'new_client_phone' => ['nullable', 'string', 'max:50'],
            'new_client_address' => ['nullable', 'string', 'max:2000'],
            'fulfillment_type' => ['required', 'string', 'in:pickup,ship'],
            'status' => ['nullable', 'string', 'in:pending,confirmed,shipped,cancelled'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_name' => ['required', 'string', 'max:255'],
            'items.*.variant' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ];
    }
}
