<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\CategoryImage;
use App\Traits\HandlesImageUploads;
use App\Traits\LogsActivity;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    use HandlesImageUploads, LogsActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $all = Category::with(['images', 'translations'])
            ->withCount('products')
            ->get();

        return Inertia::render('categories/index', [
            'categories' => Category::nestedTree($all, null),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('categories/create', [
            'parentOptions' => Category::parentSelectOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $category = Category::create([
            'parent_id' => $request->input('parent_id') ?: null,
        ]);

        foreach (config('harimi.locales', ['it', 'en']) as $loc) {
            $name = (string) $request->input("name.$loc");
            $category->translations()->create([
                'locale' => $loc,
                'slug' => \App\Support\UniqueSlug::make($name, 'category_translations', $loc),
                'name' => $name,
            ]);
        }

        // Create images
        if ($request->has('images') && is_array($request->images)) {
            foreach ($request->images as $index => $imageData) {
                $imagePath = null;

                // Handle file upload
                if (isset($imageData['file']) && $imageData['file']) {
                    $file = $request->file("images.{$index}.file");
                    if ($file && $file->isValid()) {
                        $imagePath = $this->storeImage($file, 'categories');
                    }
                } elseif (isset($imageData['path']) && $imageData['path']) {
                    // Use existing path
                    $imagePath = $imageData['path'];
                }

                if ($imagePath) {
                    CategoryImage::create([
                        'category_id' => $category->id,
                        'path' => $imagePath,
                    ]);
                }
            }
        }

        if ($request->hasFile('hero') && $request->file('hero')->isValid()) {
            $category->update([
                'hero_path' => $this->storeImage($request->file('hero'), 'categories/heroes'),
            ]);
        }

        $category->load('translations');
        $this->logActivity('created', 'Category', $category->id, "Catégorie '{$category->name}' créée");

        return redirect()->route('categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $locale, Category $category): Response
    {
        $category->load([
            'translations',
            'parent.translations',
            'children.translations',
            'images',
            'products.translations',
            'products.category.translations',
        ]);

        return Inertia::render('categories/show', [
            'category' => $category,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $locale, Category $category): Response
    {
        $category->load(['parent', 'children', 'images']);

        return Inertia::render('categories/edit', [
            'category' => $category,
            'parentOptions' => Category::parentSelectOptions($category->id),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCategoryRequest $request, string $locale, Category $category): RedirectResponse
    {
        $category->update([
            'parent_id' => $request->input('parent_id') ?: null,
        ]);

        foreach (config('harimi.locales', ['it', 'en']) as $loc) {
            $name = (string) $request->input("name.$loc");
            $existing = $category->translations()->where('locale', $loc)->first();
            $category->translations()->updateOrCreate(
                ['locale' => $loc],
                [
                    'slug' => \App\Support\UniqueSlug::make($name, 'category_translations', $loc, $existing?->id),
                    'name' => $name,
                ],
            );
        }

        // Handle image updates - delete old images that are not in the new list
        $existingImageIds = collect($request->images ?? [])
            ->pluck('id')
            ->filter()
            ->toArray();

        $imagesToDelete = $category->images()
            ->whereNotIn('id', $existingImageIds)
            ->get();

        foreach ($imagesToDelete as $image) {
            $this->deleteImage($image->path);
            $image->delete();
        }

        // Create/update images
        if ($request->has('images') && is_array($request->images)) {
            foreach ($request->images as $index => $imageData) {
                $imagePath = null;

                // Handle file upload
                if (isset($imageData['file']) && $imageData['file']) {
                    $file = $request->file("images.{$index}.file");
                    if ($file && $file->isValid()) {
                        $imagePath = $this->storeImage($file, 'categories');
                    }
                } elseif (isset($imageData['path']) && $imageData['path']) {
                    // Use existing path
                    $imagePath = $imageData['path'];
                }

                if ($imagePath) {
                    // Update existing or create new
                    if (isset($imageData['id']) && $imageData['id']) {
                        CategoryImage::where('id', $imageData['id'])
                            ->update(['path' => $imagePath]);
                    } else {
                        CategoryImage::create([
                            'category_id' => $category->id,
                            'path' => $imagePath,
                        ]);
                    }
                }
            }
        }

        if ($request->boolean('clear_hero') && $category->hero_path) {
            $this->deleteImage($category->hero_path);
            $category->update(['hero_path' => null]);
        } elseif ($request->hasFile('hero') && $request->file('hero')->isValid()) {
            if ($category->hero_path) {
                $this->deleteImage($category->hero_path);
            }
            $category->update([
                'hero_path' => $this->storeImage($request->file('hero'), 'categories/heroes'),
            ]);
        }

        $category->load('translations');
        $this->logActivity('updated', 'Category', $category->id, "Catégorie '{$category->name}' modifiée");

        return redirect()->route('categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $locale, Category $category): RedirectResponse
    {
        $category->delete();

        return redirect()->route('categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
