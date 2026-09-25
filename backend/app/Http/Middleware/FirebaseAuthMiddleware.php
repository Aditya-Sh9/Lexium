<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Factory;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class FirebaseAuthMiddleware
{
    /**
     * Firebase Auth client, built once per worker. Creating the factory
     * re-parses the service account on every call, so we reuse it.
     */
    private static ?FirebaseAuth $firebaseAuth = null;

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // ── Mock mode for local development ──────────────────────────
        if (app()->environment('local') && config('services.firebase.mock_auth')) {
            $mockUid = 'mock-uid-123';
            $request->merge(['firebase_uid' => $mockUid]);
            $request->setUserResolver(function () use ($request, $mockUid) {
                $role = $request->header('X-Mock-Role', 'provider');
                return (object)[
                    'id'   => $mockUid,
                    'role'  => $role,
                    'name'  => 'Mock ' . ucfirst($role),
                ];
            });
            return $next($request);
        }

        // ── Real Firebase token verification ─────────────────────────
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Unauthorized. No token provided.'], 401);
        }

        try {
            $auth = self::firebaseAuth();
        } catch (\RuntimeException $e) {
            Log::error('Firebase credentials unavailable: ' . $e->getMessage());
            return response()->json(['error' => 'Authentication service is not configured.'], 500);
        }

        try {
            $verifiedIdToken = $auth->verifyIdToken($token);
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => 'Unauthorized. Invalid or expired token.',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 401);
        }

        $uid = $verifiedIdToken->claims()->get('sub');
        $request->merge(['firebase_uid' => $uid]);
        // Verified email from the token — never trust the one in the request body.
        $request->attributes->set('firebase_email', $verifiedIdToken->claims()->get('email'));

        // Attach the MongoDB user record to the request
        $user = User::where('firebase_uid', $uid)->first();
        if ($user) {
            $request->setUserResolver(fn () => $user);
        } elseif (!$request->is('api/auth/sync')) {
            // A valid Firebase login with no Lexium record can only create one.
            return response()->json(['error' => 'Account not set up. Please complete registration.'], 403);
        }

        return $next($request);
    }

    private static function firebaseAuth(): FirebaseAuth
    {
        if (self::$firebaseAuth) {
            return self::$firebaseAuth;
        }

        $encoded = config('services.firebase.credentials_json');

        if ($encoded) {
            // Production: credentials provided as base64-encoded JSON string
            $serviceAccount = json_decode(base64_decode($encoded), true);
            if (!$serviceAccount) {
                throw new \RuntimeException('FIREBASE_CREDENTIALS_JSON is not valid base64-encoded JSON.');
            }
        } else {
            // Local: credentials provided as a file path
            $serviceAccount = base_path(config('services.firebase.credentials'));
            if (!file_exists($serviceAccount)) {
                throw new \RuntimeException('Set FIREBASE_CREDENTIALS_JSON or add firebase_credentials.json to the backend root.');
            }
        }

        return self::$firebaseAuth = (new Factory)->withServiceAccount($serviceAccount)->createAuth();
    }
}
