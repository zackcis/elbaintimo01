<?php

namespace App\Http\Requests;

use App\Enums\PaymentStatus;
use App\Models\Command;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateCommandRequest extends FormRequest
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
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['required', 'email', 'max:255'],
            'fulfillment_type' => ['required', 'string', 'in:pickup,ship'],
            'status' => ['required', 'string', 'in:pending,confirmed,shipped,cancelled'],
            'notes' => ['nullable', 'string'],
            'shipping_carrier' => ['nullable', 'string', 'max:100'],
            'tracking_number' => ['nullable', 'string', 'max:120'],
            'tracking_url' => ['nullable', 'url', 'max:500'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.product_name' => ['required_with:items', 'string', 'max:255'],
            'items.*.variant' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $command = $this->route('command');
            if (! $command instanceof Command) {
                return;
            }

            $newStatus = (string) $this->input('status');
            $isStorefront = $command->source === 'storefront';

            if ($command->status === 'cancelled' && $newStatus !== 'cancelled') {
                $v->errors()->add('status', 'A cancelled order cannot be reactivated.');
            }

            if ($command->status === 'shipped' && $newStatus === 'cancelled') {
                $v->errors()->add('status', 'A shipped order cannot be cancelled.');
            }

            if ($isStorefront && $newStatus === 'shipped') {
                $payment = $command->payment_status;
                $paymentValue = $payment instanceof PaymentStatus
                    ? $payment->value
                    : (string) $payment;

                if ($paymentValue !== PaymentStatus::Paid->value) {
                    $v->errors()->add('status', 'Storefront orders can only be shipped after payment.');
                }
            }

            if ($isStorefront && $this->filled('items')) {
                $v->errors()->add('items', 'Storefront order line items cannot be modified.');
            }
        });
    }
}
