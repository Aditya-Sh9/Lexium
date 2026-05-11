<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;

class AdminAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Unauthorized. Admin token missing.'], 401);
        }

        $admin = User::where('admin_token', $token)
                     ->where('role', 'admin')
                     ->first();

        if (!$admin) {
            return response()->json(['error' => 'Unauthorized. Invalid admin token.'], 401);
        }

        // Attach the admin user to the request for easy access later
        $request->merge(['admin_user' => $admin]);

        return $next($request);
    }
}
