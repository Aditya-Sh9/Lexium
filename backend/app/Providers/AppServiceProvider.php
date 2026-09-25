<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Named limiters, each with its own key prefix. The inline
        // "throttle:5,10" form shares one counter per IP across every route,
        // so ordinary browsing would use up the contact form's allowance.
        $tooMany = fn (string $message) => fn (Request $request, array $headers) =>
            response()->json(['error' => $message], 429, $headers);

        RateLimiter::for('public-api', fn (Request $request) =>
            Limit::perMinute(120)->by('public|' . $request->ip()));

        RateLimiter::for('authenticated', fn (Request $request) =>
            Limit::perMinute(180)->by('auth|' . ($request->bearerToken() ? hash('sha256', $request->bearerToken()) : $request->ip())));

        RateLimiter::for('contact', fn (Request $request) =>
            Limit::perMinutes(10, 5)->by('contact|' . $request->ip())
                ->response($tooMany('You’ve sent several messages in a short time. Please wait a few minutes and try again.')));

        RateLimiter::for('admin-login', fn (Request $request) => [
            Limit::perMinute(5)->by('admin-login|' . $request->ip())
                ->response($tooMany('Too many sign-in attempts. Please wait a minute and try again.')),
            Limit::perHour(20)->by('admin-login-email|' . strtolower((string) $request->input('email'))),
        ]);
    }
}
