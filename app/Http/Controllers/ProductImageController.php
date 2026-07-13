<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductImage;
use App\Traits\HandlesImageUploads;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    use HandlesImageUploads;

    /**
     * Store a newly created image in storage.
     */
    public function store(Request $request, string $locale, Product $product): RedirectResponse
    {
        $request->validate([
            'path' => ['required', 'string'],
            'is_primary' => ['boolean'],
            'position' => ['integer', 'min:0'],
        ]);

        ProductImage::create([
            'product_id' => $product->id,
            'path' => $request->path,
            'is_primary' => $request->is_primary ?? false,
            'position' => $request->position ?? 0,
        ]);

        return redirect()->back()
            ->with('success', 'Image added successfully.');
    }

    /**
     * Remove the specified image from storage.
     */
    public function destroy(string $locale, Product $product, ProductImage $productImage): RedirectResponse
    {
        // Delete file from storage
        $this->deleteImage($productImage->path);

        // Delete database record
        $productImage->delete();

        return redirect()->back()
            ->with('success', 'Image deleted successfully.');
    }
}
