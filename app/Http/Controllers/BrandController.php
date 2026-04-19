<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBrandRequest;
use App\Http\Requests\UpdateBrandRequest;
use App\Models\Brand;
use App\Traits\HandlesImageUploads;
use App\Traits\LogsActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    use HandlesImageUploads, LogsActivity;

    /**
     * Display a listing of brands.
     */
    public function index(): Response
    {
        $brands = Brand::withCount('products')
            ->orderBy('name')
            ->get();

        return Inertia::render('brands/index', [
            'brands' => $brands,
        ]);
    }

    /**
     * Show the form for creating a new brand.
     */
    public function create(): Response
    {
        return Inertia::render('brands/create');
    }

    /**
     * Store a newly created brand.
     */
    public function store(StoreBrandRequest $request): RedirectResponse
    {
        $logoPath = null;
        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            $logoPath = $this->storeImage($request->file('logo'), 'brands');
        }

        $brand = Brand::create([
            'name' => $request->name,
            'logo' => $logoPath,
        ]);

        $this->logActivity('created', 'Brand', $brand->id, "Marque '{$brand->name}' créée");

        return redirect()->route('brands.index')
            ->with('success', 'Brand created successfully.');
    }

    /**
     * Show the form for editing the specified brand.
     */
    public function edit(Brand $brand): Response
    {
        return Inertia::render('brands/edit', [
            'brand' => $brand,
        ]);
    }

    /**
     * Update the specified brand.
     */
    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $brand->update(['name' => $request->name]);

        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            if ($brand->logo) {
                $this->deleteImage($brand->logo);
            }
            $logoPath = $this->storeImage($request->file('logo'), 'brands');
            $brand->update(['logo' => $logoPath]);
        }

        $this->logActivity('updated', 'Brand', $brand->id, "Marque '{$brand->name}' modifiée");

        return redirect()->route('brands.index')
            ->with('success', 'Brand updated successfully.');
    }

    /**
     * Remove the specified brand.
     */
    public function destroy(Brand $brand): RedirectResponse
    {
        $name = $brand->name;
        if ($brand->logo) {
            $this->deleteImage($brand->logo);
        }
        $brand->delete();

        $this->logActivity('deleted', 'Brand', null, "Marque '{$name}' supprimée");

        return redirect()->route('brands.index')
            ->with('success', 'Brand deleted successfully.');
    }

    /**
     * Update brand logo (legacy route for backward compatibility).
     */
    public function updateLogo(Request $request, Brand $brand): RedirectResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
        ]);

        if ($brand->logo) {
            $this->deleteImage($brand->logo);
        }

        $logoPath = $this->storeImage($request->file('logo'), 'brands');
        $brand->update(['logo' => $logoPath]);

        $this->logActivity('updated', 'Brand', $brand->id, "Logo de la marque '{$brand->name}' mis à jour");

        return redirect()->back()
            ->with('success', 'Brand logo updated successfully.');
    }
}
