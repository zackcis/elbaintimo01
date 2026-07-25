<?php

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => env('HARIMI_STOREFRONT_ORIGINS')
        ? array_values(array_filter(array_map('trim', explode(',', (string) env('HARIMI_STOREFRONT_ORIGINS')))))
        : ['http://localhost:3000'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
