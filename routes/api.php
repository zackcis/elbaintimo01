<?php

use App\Http\Controllers\Api\V1\BrandController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\Checkout\StripeWebhookController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MerchandisingController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SiteMediaController;
use App\Http\Middleware\SetStorefrontLocale;
use Illuminate\Support\Facades\Route;

Route::post('v1/webhooks/stripe', StripeWebhookController::class)
    ->middleware('throttle:120,1')
    ->name('api.v1.webhooks.stripe');

Route::prefix('v1')
    ->middleware([SetStorefrontLocale::class, 'throttle:api'])
    ->group(function () {
        Route::get('health', HealthController::class)->name('api.v1.health');

        Route::get('categories', [CategoryController::class, 'index'])->name('api.v1.categories.index');
        Route::get('categories/{slug}', [CategoryController::class, 'show'])->name('api.v1.categories.show');

        Route::get('brands', [BrandController::class, 'index'])->name('api.v1.brands.index');
        Route::get('brands/{slug}', [BrandController::class, 'show'])->name('api.v1.brands.show');

        Route::get('products', [ProductController::class, 'index'])->name('api.v1.products.index');
        Route::get('products/{slug}', [ProductController::class, 'show'])->name('api.v1.products.show');

        Route::get('merchandising', [MerchandisingController::class, 'index'])->name('api.v1.merchandising.index');
        Route::get('merchandising/{shelf}', [MerchandisingController::class, 'show'])->name('api.v1.merchandising.show');

        Route::get('site-media', [SiteMediaController::class, 'index'])->name('api.v1.site-media.index');

        Route::prefix('checkout')->group(function () {
            Route::post('preview', [\App\Http\Controllers\Api\V1\Checkout\CheckoutController::class, 'preview'])
                ->name('api.v1.checkout.preview');
            Route::post('orders', [\App\Http\Controllers\Api\V1\Checkout\CheckoutController::class, 'store'])
                ->middleware('throttle:30,1')
                ->name('api.v1.checkout.orders.store');
            Route::get('orders/{reference}', [\App\Http\Controllers\Api\V1\Checkout\CheckoutController::class, 'show'])
                ->name('api.v1.checkout.orders.show');
        });
    });
