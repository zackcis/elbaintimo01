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
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use HandlesImageUploads, LogsActivity;

    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'brand' => ['nullable', 'integer', 'exists:brands,id'],
            'category' => ['nullable', 'integer', 'exists:categories,id'],
            'tissu' => ['nullable', 'string', 'max:255'],
        ]);

        $query = Product::query()
            ->with(['category.translations', 'brand.translations', 'translations', 'variants', 'images'])
            ->latest();

        if (! empty($validated['brand'])) {
            $query->where('brand_id', $validated['brand']);
        }

        if (! empty($validated['category'])) {
            $query->where('category_id', $validated['category']);
        }

        $tissuFilter = isset($validated['tissu']) ? trim((string) $validated['tissu']) : '';
        if ($tissuFilter !== '') {
            $query->where('tissu', $tissuFilter);
        }

        $products = $query->paginate(12)->withQueryString();

        $tissuOptions = Product::query()
            ->whereNotNull('tissu')
            ->where('tissu', '!=', '')
            ->distinct()
            ->orderBy('tissu')
            ->pluck('tissu')
            ->values();

        $filterBrand = null;
        if (! empty($validated['brand'])) {
            $b = Brand::query()->with('translations')->find($validated['brand']);
            $filterBrand = $b ? ['id' => $b->id, 'name' => $b->name] : null;
        }

        $filterCategory = null;
        if (! empty($validated['category'])) {
            $c = Category::query()->with('translations')->find($validated['category']);
            $filterCategory = $c ? ['id' => $c->id, 'name' => $c->name] : null;
        }

        return Inertia::render('products/index', [
            'products' => $products,
            'tissuOptions' => $tissuOptions,
            'filters' => [
                'brand_id' => $validated['brand'] ?? null,
                'category_id' => $validated['category'] ?? null,
                'tissu' => $tissuFilter !== '' ? $tissuFilter : null,
                'brand' => $filterBrand,
                'category' => $filterCategory,
            ],
        ]);
    }

    public function create(): Response
    {
        $categories = Category::query()->with('translations')->get()->sortBy('name')->values();
        $brands = Brand::query()->with('translations')->get()->sortBy('name')->values();

        return Inertia::render('products/create', [
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $brandId = $request->input('brand_id');

        if (! $request->filled('brand_id')) {
            $it = $request->input('new_brand_name.it');
            $en = $request->input('new_brand_name.en');
            if (filled($it) && filled($en)) {
                $logoPath = null;
                if ($request->hasFile('new_brand_logo') && $request->file('new_brand_logo')->isValid()) {
                    $logoPath = $this->storeImage($request->file('new_brand_logo'), 'brands');
                }
                $brand = Brand::create([
                    'logo' => $logoPath,
                ]);
                foreach (config('harimi.locales', ['it', 'en']) as $loc) {
                    $name = (string) $request->input("new_brand_name.$loc");
                    $brand->translations()->create([
                        'locale' => $loc,
                        'slug' => \App\Support\UniqueSlug::make($name, 'brand_translations', $loc),
                        'name' => $name,
                    ]);
                }
                $brandId = $brand->id;
                $this->logActivity('created', 'Brand', $brand->id, "Marque '{$brand->name}' créée (via produit)");
            }
        }

        $tissuRaw = $request->input('tissu');
        $tissu = is_string($tissuRaw) && trim($tissuRaw) !== '' ? trim($tissuRaw) : null;

        $product = Product::create([
            'category_id' => (int) $request->validated('category_id'),
            'brand_id' => $brandId ? (int) $brandId : null,
            'tissu' => $tissu,
            'is_published' => false,
            'published_at' => null,
        ]);

        foreach (config('harimi.locales', ['it', 'en']) as $loc) {
            $title = (string) $request->input("title.$loc");
            $product->translations()->create([
                'locale' => $loc,
                'slug' => \App\Support\UniqueSlug::make($title, 'product_translations', $loc),
                'title' => $title,
                'description' => $request->input("description.$loc"),
                'care_notes' => $request->input("care_notes.$loc"),
                'fit_notes' => $request->input("fit_notes.$loc"),
            ]);
        }

        foreach ($request->validated('variants') as $variantData) {
            ProductVariant::create([
                'product_id' => $product->id,
                'size' => $variantData['size'] ?? null,
                'color' => $variantData['color'] ?? null,
                'color_hex' => $this->normalizeHexColor($variantData['color_hex'] ?? null),
                'price' => $variantData['price'],
                'compare_at_price' => $variantData['compare_at_price'] ?? null,
                'stock' => $variantData['stock'],
            ]);
        }

        if ($request->has('images') && is_array($request->images)) {
            foreach ($request->images as $index => $imageData) {
                $imagePath = null;

                if (isset($imageData['file']) && $imageData['file']) {
                    $file = $request->file("images.{$index}.file");
                    if ($file && $file->isValid()) {
                        $imagePath = $this->storeImage($file, 'products');
                    }
                } elseif (isset($imageData['path']) && $imageData['path']) {
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

        $product->load('translations');
        $this->logActivity('created', 'Product', $product->id, "Produit '{$product->title}' créé");

        return redirect()->route('products.index')
            ->with('success', 'Product created successfully.');
    }

    public function show(string $locale, Product $product): Response
    {
        $product->load([
            'category.translations',
            'brand.translations',
            'translations',
            'variants',
            'images',
        ]);

        $relatedProducts = Product::query()
            ->where('brand_id', $product->brand_id)
            ->where('id', '!=', $product->id)
            ->with(['category.translations', 'translations', 'variants', 'images'])
            ->latest()
            ->limit(8)
            ->get();

        return Inertia::render('products/show', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function edit(string $locale, Product $product): Response
    {
        $product->load([
            'category.translations',
            'brand.translations',
            'translations',
            'variants',
            'images',
            'relatedProducts.translations',
        ]);
        $categories = Category::query()->with('translations')->get()->sortBy('name')->values();
        $brands = Brand::query()->with('translations')->get()->sortBy('name')->values();
        $relatedCandidates = Product::query()
            ->with(['translations', 'images'])
            ->where('products.id', '!=', $product->id)
            ->adminOrderByTitle()
            ->limit(200)
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'is_published' => (bool) $p->is_published,
            ])
            ->values();

        return Inertia::render('products/edit', [
            'product' => $product,
            'categories' => $categories,
            'brands' => $brands,
            'relatedCandidates' => $relatedCandidates,
            'relatedProductIds' => $product->relatedProducts->pluck('id')->values(),
        ]);
    }

    public function update(UpdateProductRequest $request, string $locale, Product $product): RedirectResponse
    {
        $brandId = $request->input('brand_id');

        if (! $request->filled('brand_id')) {
            $it = $request->input('new_brand_name.it');
            $en = $request->input('new_brand_name.en');
            if (filled($it) && filled($en)) {
                $logoPath = null;
                if ($request->hasFile('new_brand_logo') && $request->file('new_brand_logo')->isValid()) {
                    $logoPath = $this->storeImage($request->file('new_brand_logo'), 'brands');
                }
                $brand = Brand::create([
                    'logo' => $logoPath,
                ]);
                foreach (config('harimi.locales', ['it', 'en']) as $loc) {
                    $name = (string) $request->input("new_brand_name.$loc");
                    $brand->translations()->create([
                        'locale' => $loc,
                        'slug' => \App\Support\UniqueSlug::make($name, 'brand_translations', $loc),
                        'name' => $name,
                    ]);
                }
                $brandId = $brand->id;
                $this->logActivity('created', 'Brand', $brand->id, "Marque '{$brand->name}' créée (via produit)");
            }
        }

        $tissuRaw = $request->input('tissu');
        $tissu = is_string($tissuRaw) && trim($tissuRaw) !== '' ? trim($tissuRaw) : null;

        $isPublished = $request->boolean('is_published');
        $wasPublished = (bool) $product->is_published;

        $product->update([
            'category_id' => (int) $request->validated('category_id'),
            'brand_id' => $brandId ? (int) $brandId : null,
            'tissu' => $tissu,
            'is_published' => $isPublished,
            'published_at' => $isPublished
                ? ($product->published_at ?? now())
                : null,
        ]);

        if ($wasPublished && ! $isPublished) {
            \App\Models\MerchandisingItem::query()
                ->where('product_id', $product->id)
                ->delete();
            \App\Models\MerchandisingPin::query()
                ->where('product_id', $product->id)
                ->delete();
        }

        foreach (config('harimi.locales', ['it', 'en']) as $loc) {
            $title = (string) $request->input("title.$loc");
            $existing = $product->translations()->where('locale', $loc)->first();
            $product->translations()->updateOrCreate(
                ['locale' => $loc],
                [
                    'slug' => \App\Support\UniqueSlug::make(
                        $title,
                        'product_translations',
                        $loc,
                        $existing?->id,
                    ),
                    'title' => $title,
                    'description' => $request->input("description.$loc"),
                    'care_notes' => $request->input("care_notes.$loc"),
                    'fit_notes' => $request->input("fit_notes.$loc"),
                ],
            );
        }

        $relatedIds = collect($request->input('related_product_ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0 && $id !== $product->id)
            ->unique()
            ->values();
        $sync = [];
        foreach ($relatedIds as $position => $relatedId) {
            $sync[$relatedId] = ['position' => $position];
        }
        $product->relatedProducts()->sync($sync);

        $product->variants()->delete();

        foreach ($request->validated('variants') as $variantData) {
            ProductVariant::create([
                'product_id' => $product->id,
                'size' => $variantData['size'] ?? null,
                'color' => $variantData['color'] ?? null,
                'color_hex' => $this->normalizeHexColor($variantData['color_hex'] ?? null),
                'price' => $variantData['price'],
                'compare_at_price' => $variantData['compare_at_price'] ?? null,
                'stock' => $variantData['stock'],
            ]);
        }

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

        if ($request->has('images') && is_array($request->images)) {
            foreach ($request->images as $index => $imageData) {
                $imagePath = null;

                if (isset($imageData['file']) && $imageData['file']) {
                    $file = $request->file("images.{$index}.file");
                    if ($file && $file->isValid()) {
                        $imagePath = $this->storeImage($file, 'products');
                    }
                } elseif (isset($imageData['path']) && $imageData['path']) {
                    $imagePath = $imageData['path'];
                }

                if ($imagePath) {
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

        $product->load('translations');
        $this->logActivity('updated', 'Product', $product->id, "Produit '{$product->title}' modifié");

        return redirect()->route('products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(string $locale, Product $product): RedirectResponse
    {
        $product->load('translations');
        $title = $product->title;
        $product->delete();

        $this->logActivity('deleted', 'Product', null, "Produit '{$title}' supprimé");

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully.');
    }

    private function normalizeHexColor(mixed $hex): ?string
    {
        if (! is_string($hex)) {
            return null;
        }

        $trimmed = trim($hex);
        if ($trimmed === '') {
            return null;
        }

        return strtoupper($trimmed);
    }
}
