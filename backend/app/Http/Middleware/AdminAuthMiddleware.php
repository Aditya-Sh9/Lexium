<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Models\User;

class AdminAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Unauthorized. Admin token missing.'], 401);
        }

        // Only a SHA-256 hash of the token is stored, so a leaked database
        // dump can't be replayed as a live admin session.
        $admin = User::where('admin_token', hash('sha256', $token))
                     ->where('role', 'admin')
                     ->first();

        if (!$admin) {
            return response()->json(['error' => 'Unauthorized. Invalid admin token.'], 401);
        }

        $expiresAt = $admin->admin_token_expires_at ? Carbon::parse($admin->admin_token_expires_at) : null;
        if (!$expiresAt || $expiresAt->isPast()) {
            $admin->update(['admin_token' => null, 'admin_token_expires_at' => null]);
            return response()->json(['error' => 'Admin session expired. Please sign in again.'], 401);
        }

        // Attach the admin user to the request for easy access later
        $request->merge(['admin_user' => $admin]);

        return $next($request);
    }
}
