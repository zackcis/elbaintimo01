<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
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
        /** @var Category $category */
        $category = $this->route('category');
        $forbiddenParentIds = array_merge(
            [$category->id],
            Category::descendantIds($category->id),
        );

        return [
            'name.it' => ['required', 'string', 'max:255'],
            'name.en' => ['required', 'string', 'max:255'],
            'parent_id' => [
                'nullable',
                'exists:categories,id',
                Rule::notIn($forbiddenParentIds),
            ],
            'images' => ['nullable', 'array'],
            'images.*.file' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'images.*.path' => ['nullable', 'string'],
            'hero' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'clear_hero' => ['nullable', 'boolean'],
        ];
    }
}
