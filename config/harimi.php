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

];
