<?php

use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Middleware\SetLocaleFromUrl;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return redirect('/'.config('harimi.public_default_locale', 'it'));
})->name('home');

Route::prefix('{locale}')
    ->whereIn('locale', config('harimi.locales', ['it', 'en']))
    ->middleware([SetLocaleFromUrl::class])
    ->group(function () {
        Route::get('/', function () {
            return Inertia::render('welcome', [
                'canRegister' => Features::enabled(Features::registration()),
            ]);
        })->name('storefront.home');

        require __DIR__.'/fortify.php';

        Route::middleware(['auth', 'verified'])->group(function () {
            Route::get('dashboard', function () {
                $stats = [
                    'total_products' => \App\Models\Product::count(),
                    'total_categories' => \App\Models\Category::count(),
                    'total_variants' => \App\Models\ProductVariant::count(),
                    'total_clients' => \App\Models\User::query()->where('role', 'client')->count(),
                    'total_stock' => \App\Models\ProductVariant::sum('stock'),
                    'low_stock_variants' => \App\Models\ProductVariant::where('stock', '<', 10)->count(),
                    'total_commands_this_month' => \App\Models\Command::whereMonth('created_at', now()->month)
                        ->whereYear('created_at', now()->year)
                        ->count(),
                    'chiffre_affaires' => \App\Models\Command::whereMonth('created_at', now()->month)
                        ->whereYear('created_at', now()->year)
                        ->sum('total_amount'),
                    'pending_commands' => \App\Models\Command::where('status', 'pending')->count(),
                    'critical_stock' => \App\Models\ProductVariant::where('stock', '<', 10)->count(),
                ];

                $recentActivities = \App\Models\ActivityLog::latest()
                    ->limit(10)
                    ->get();

                return Inertia::render('dashboard', [
                    'stats' => $stats,
                    'recentActivities' => $recentActivities,
                ]);
            })->name('dashboard');

            Route::resource('products', ProductController::class);

            Route::resource('categories', CategoryController::class);

            Route::resource('brands', BrandController::class)->except(['show']);
            Route::post('brands/{brand}/logo', [BrandController::class, 'updateLogo'])->name('brands.logo.update');

            Route::resource('commands', \App\Http\Controllers\CommandController::class);
            Route::get('commands/{command}/invoice', [\App\Http\Controllers\CommandController::class, 'invoice'])->name('commands.invoice');

            Route::post('products/{product}/images', [ProductImageController::class, 'store'])
                ->name('products.images.store');
            Route::delete('products/{product}/images/{productImage}', [ProductImageController::class, 'destroy'])
                ->name('products.images.destroy');

            Route::get('clients', function () {
                $clients = \App\Models\User::query()
                    ->where('role', 'client')
                    ->latest()
                    ->paginate(12);

                return Inertia::render('clients/index', [
                    'clients' => $clients,
                ]);
            })->name('clients.index');
        });

        Route::middleware('auth')->group(function () {
            require __DIR__.'/settings.php';
        });
    });
