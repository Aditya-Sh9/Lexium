<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'firebase' => [
        // Production: base64-encoded service-account JSON. Local: path to the JSON file.
        'credentials_json' => env('FIREBASE_CREDENTIALS_JSON'),
        'credentials'      => env('FIREBASE_CREDENTIALS', 'firebase_credentials.json'),
        // Bypasses token verification — only honoured when APP_ENV=local.
        'mock_auth'        => (bool) env('MOCK_AUTH', false),
    ],

    'contact' => [
        // Inbox that receives Contact-form messages from the public site.
        'to' => env('CONTACT_RECIPIENT', 'adityasharma.reach@gmail.com'),
    ],

    'admin' => [
        // Hours an admin session token stays valid.
        'token_ttl_hours' => (int) env('ADMIN_TOKEN_TTL_HOURS', 12),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
