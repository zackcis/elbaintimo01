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
        $all = Category::with(['images'])
            ->withCount('products')
            ->orderBy('name')
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
            'name' => $request->validated('name'),
            'parent_id' => $request->validated('parent_id'),
        ]);

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

        $this->logActivity('created', 'Category', $category->id, "Catégorie '{$category->name}' créée");

        return redirect()->route('categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category): Response
    {
        $category->load(['parent', 'children', 'images', 'products']);

        return Inertia::render('categories/show', [
            'category' => $category,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Category $category): Response
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
    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $category->update([
            'name' => $request->validated('name'),
            'parent_id' => $request->validated('parent_id'),
        ]);

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

        $this->logActivity('updated', 'Category', $category->id, "Catégorie '{$category->name}' modifiée");

        return redirect()->route('categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return redirect()->route('categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
