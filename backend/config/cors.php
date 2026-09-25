<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for cross-origin resource sharing. These determine what
    | cross-origin operations may execute in web browsers.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],

    'allowed_methods' => ['*'],

    // env() takes a single default — all fallback origins must live in one comma-separated string.
    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5173,http://localhost:3000,https://lexium-liard.vercel.app,https://lexium-law.vercel.app'
    ))))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    // Let browsers cache preflight responses for an hour.
    'max_age' => 3600,

    // Auth uses Bearer tokens, not cookies — credentials mode isn't needed.
    'supports_credentials' => false,

];
