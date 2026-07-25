<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Supported storefront locales (path prefix: /it/..., /en/...)
    |--------------------------------------------------------------------------
    */
    'locales' => ['it', 'en'],

    /*
    |--------------------------------------------------------------------------
    | Default locale for public URLs when visiting /
    |--------------------------------------------------------------------------
    */
    'public_default_locale' => env('HARIMI_PUBLIC_DEFAULT_LOCALE', 'it'),

    /*
    |--------------------------------------------------------------------------
    | Locale used for admin lists, selects, and filters (single column display)
    |--------------------------------------------------------------------------
    */
    'admin_list_locale' => env('HARIMI_ADMIN_LIST_LOCALE', 'it'),

    /*
    |--------------------------------------------------------------------------
    | Storefront CORS origins (Next.js)
    |--------------------------------------------------------------------------
    */
    'storefront_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('HARIMI_STOREFRONT_ORIGINS', 'http://localhost:3000'))
    ))),

    /*
    |--------------------------------------------------------------------------
    | Manual merchandising shelves exposed via /api/v1/merchandising
    |--------------------------------------------------------------------------
    */
    'merchandising_shelves' => [
        'best_sellers',
        'new_arrivals',
        'featured',
        'special_offers',
    ],

    /*
    |--------------------------------------------------------------------------
    | Storefront checkout (Increment 3 defaults; VAT mode TBD with client)
    |--------------------------------------------------------------------------
    */
    'checkout' => [
        'currency' => env('HARIMI_CURRENCY', 'EUR'),
        'flat_shipping_amount' => env('HARIMI_FLAT_SHIPPING_AMOUNT', '5.90'),
        // Shelf prices treated as IVA-inclusa until client confirms otherwise.
        'prices_include_tax' => filter_var(env('HARIMI_PRICES_INCLUDE_TAX', true), FILTER_VALIDATE_BOOL),
        'tax_rate' => (float) env('HARIMI_TAX_RATE', 0.22),
        'default_shipping_country' => 'IT',
        // Unpaid storefront orders older than this are auto-cancelled (stock was never held).
        'abandoned_checkout_hours' => (int) env('HARIMI_ABANDONED_CHECKOUT_HOURS', 24),
    ],

    /*
    |--------------------------------------------------------------------------
    | Inventory alerts
    |--------------------------------------------------------------------------
    */
    'inventory' => [
        'low_stock_threshold' => (int) env('HARIMI_LOW_STOCK_THRESHOLD', 10),
        // Daily IT digest to staff (or HARIMI_LOW_STOCK_DIGEST_RECIPIENTS).
        'digest_enabled' => filter_var(env('HARIMI_LOW_STOCK_DIGEST_ENABLED', true), FILTER_VALIDATE_BOOL),
        'digest_time' => env('HARIMI_LOW_STOCK_DIGEST_TIME', '08:00'),
        'digest_recipients' => env('HARIMI_LOW_STOCK_DIGEST_RECIPIENTS', ''),
    ],

];
