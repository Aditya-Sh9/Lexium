<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class FirebaseAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // ── Mock mode for local development ──────────────────────────
        if (env('APP_ENV') === 'local' && env('MOCK_AUTH', false)) {
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
            // ── Load credentials from env var (production) or file (local) ──
            $credentialsJsonBase64 = env('FIREBASE_CREDENTIALS_JSON');

            if ($credentialsJsonBase64) {
                // Production: credentials provided as base64-encoded JSON string
                $serviceAccount = json_decode(base64_decode($credentialsJsonBase64), true);
                if (!$serviceAccount) {
                    return response()->json(['error' => 'Invalid FIREBASE_CREDENTIALS_JSON environment variable.'], 500);
                }
                $factory = (new \Kreait\Firebase\Factory)->withServiceAccount($serviceAccount);
            } else {
                // Local: credentials provided as a file path
                $credentialsPath = base_path(env('FIREBASE_CREDENTIALS', 'firebase_credentials.json'));
                if (!file_exists($credentialsPath)) {
                    return response()->json(['error' => 'Firebase credentials not found. Set FIREBASE_CREDENTIALS_JSON env var or add firebase_credentials.json to backend root.'], 500);
                }
                $factory = (new \Kreait\Firebase\Factory)->withServiceAccount($credentialsPath);
            }

            $auth = $factory->createAuth();
            $verifiedIdToken = $auth->verifyIdToken($token);
            $uid = $verifiedIdToken->claims()->get('sub');

            $request->merge(['firebase_uid' => $uid]);

            // Attach the MongoDB user record to the request
            $user = User::where('firebase_uid', $uid)->first();
            if ($user) {
                $request->setUserResolver(function () use ($user) {
                    return $user;
                });
            }

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Unauthorized. Invalid token.',
                'details' => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 401);
        }

        return $next($request);
    }
}
