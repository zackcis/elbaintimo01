<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBrandRequest extends FormRequest
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
            'name.it' => ['required', 'string', 'max:255'],
            'name.en' => ['required', 'string', 'max:255'],
            // Logos: PNG/SVG preferred (transparency). `image` rule rejects SVG.
            'logo' => ['nullable', 'file', 'mimes:png,svg,jpeg,jpg,webp,gif', 'max:5120'],
            'hero' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'clear_hero' => ['nullable', 'boolean'],
        ];
    }
}
