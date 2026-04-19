<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Traits\HandlesImageUploads;
use App\Traits\LogsActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use HandlesImageUploads, LogsActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'brand' => ['nullable', 'integer', 'exists:brands,id'],
            'category' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $query = Product::with(['category', 'brand', 'variants', 'images'])->latest();

        if (! empty($validated['brand'])) {
            $query->where('brand_id', $validated['brand']);
        }

        if (! empty($validated['category'])) {
            $query->where('category_id', $validated['category']);
        }

        $products = $query->paginate(12)->withQueryString();

        $filterBrand = null;
        if (! empty($validated['brand'])) {
            $b = Brand::query()->find($validated['brand']);
            $filterBrand = $b ? ['id' => $b->id, 'name' => $b->name] : null;
        }

        $filterCategory = null;
        if (! empty($validated['category'])) {
            $c = Category::query()->find($validated['category']);
            $filterCategory = $c ? ['id' => $c->id, 'name' => $c->name] : null;
        }

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => [
                'brand_id' => $validated['brand'] ?? null,
                'category_id' => $validated['category'] ?? null,
                'brand' => $filterBrand,
                'category' => $filterCategory,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $categories = Category::orderBy('name')->get();
        $brands = Brand::orderBy('name')->get();

        return Inertia::render('products/create', [
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductRequest $request): RedirectResponse
    {
        $brandId = $request->brand_id;

        if (! empty($request->new_brand_name)) {
            $logoPath = null;
            if ($request->hasFile('new_brand_logo') && $request->file('new_brand_logo')->isValid()) {
                $logoPath = $this->storeImage($request->file('new_brand_logo'), 'brands');
            }
            $brand = Brand::create([
                'name' => $request->new_brand_name,
                'logo' => $logoPath,
            ]);
            $brandId = $brand->id;
            $this->logActivity('created', 'Brand', $brand->id, "Marque '{$brand->name}' créée (via produit)");
        }

        $product = Product::create([
            'title' => $request->title,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'brand_id' => $brandId,
        ]);

        // Create variants
        foreach ($request->variants as $variantData) {
            ProductVariant::create([
                'product_id' => $product->id,
                'size' => $variantData['size'] ?? null,
                'color' => $variantData['color'] ?? null,
                'price' => $variantData['price'],
                'stock' => $variantData['stock'],
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
                        $imagePath = $this->storeImage($file, 'products');
                    }
                } elseif (isset($imageData['path']) && $imageData['path']) {
                    // Use existing path
                    $imagePath = $imageData['path'];
                }

                if ($imagePath) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'path' => $imagePath,
                        'is_primary' => $imageData['is_primary'] ?? ($index === 0),
                        'position' => $imageData['position'] ?? $index,
                    ]);
                }
            }
        }

        $this->logActivity('created', 'Product', $product->id, "Produit '{$product->title}' créé");

        return redirect()->route('products.index')
            ->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product): Response
    {
        $product->load(['category', 'brand', 'variants', 'images']);

        // Get related products from the same brand (excluding current product)
        $relatedProducts = Product::where('brand_id', $product->brand_id)
            ->where('id', '!=', $product->id)
            ->with(['category', 'variants', 'images'])
            ->latest()
            ->limit(8)
            ->get();

        return Inertia::render('products/show', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product): Response
    {
        $product->load(['category', 'brand', 'variants', 'images']);
        $categories = Category::orderBy('name')->get();
        $brands = Brand::orderBy('name')->get();

        return Inertia::render('products/edit', [
            'product' => $product,
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $brandId = $request->brand_id;

        if (! empty($request->new_brand_name)) {
            $logoPath = null;
            if ($request->hasFile('new_brand_logo') && $request->file('new_brand_logo')->isValid()) {
                $logoPath = $this->storeImage($request->file('new_brand_logo'), 'brands');
            }
            $brand = Brand::create([
                'name' => $request->new_brand_name,
                'logo' => $logoPath,
            ]);
            $brandId = $brand->id;
            $this->logActivity('created', 'Brand', $brand->id, "Marque '{$brand->name}' créée (via produit)");
        }

        $product->update([
            'title' => $request->title,
            'description' => $request->description,
            'category_id' => $request->category_id,
            'brand_id' => $brandId,
        ]);

        // Delete existing variants
        $product->variants()->delete();

        // Create new variants
        foreach ($request->variants as $variantData) {
            ProductVariant::create([
                'product_id' => $product->id,
                'size' => $variantData['size'] ?? null,
                'color' => $variantData['color'] ?? null,
                'price' => $variantData['price'],
                'stock' => $variantData['stock'],
            ]);
        }

        // Handle image updates - delete old images that are not in the new list
        $existingImageIds = collect($request->images ?? [])
            ->pluck('id')
            ->filter()
            ->toArray();

        $imagesToDelete = $product->images()
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
                        $imagePath = $this->storeImage($file, 'products');
                    }
                } elseif (isset($imageData['path']) && $imageData['path']) {
                    // Use existing path
                    $imagePath = $imageData['path'];
                }

                if ($imagePath) {
                    // Update existing or create new
                    if (isset($imageData['id']) && $imageData['id']) {
                        ProductImage::where('id', $imageData['id'])
                            ->update([
                                'path' => $imagePath,
                                'is_primary' => $imageData['is_primary'] ?? false,
                                'position' => $imageData['position'] ?? $index,
                            ]);
                    } else {
                        ProductImage::create([
                            'product_id' => $product->id,
                            'path' => $imagePath,
                            'is_primary' => $imageData['is_primary'] ?? ($index === 0),
                            'position' => $imageData['position'] ?? $index,
                        ]);
                    }
                }
            }
        }

        $this->logActivity('updated', 'Product', $product->id, "Produit '{$product->title}' modifié");

        return redirect()->route('products.index')
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $title = $product->title;
        $product->delete();

        $this->logActivity('deleted', 'Product', null, "Produit '{$title}' supprimé");

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully.');
    }
}
