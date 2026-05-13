<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Provider;

class AuthController extends Controller
{
    /**
     * Sync the Firebase user with the MongoDB database.
     * Called after frontend Firebase login/register to ensure a user record exists.
     * For providers: accepts all onboarding data and sets status to 'pending'.
     */
    public function sync(Request $request)
    {
        $uid   = $request->firebase_uid;
        $role  = $request->input('role', $request->header('X-Mock-Role', 'citizen'));
        $name  = $request->input('name', 'User');
        $email = $request->input('email', '');
        $phone = $request->input('phone', '');

        // Determine initial status
        $status = $role === 'provider' ? 'pending' : 'active';

        // Check if user already exists (for login re-sync)
        $existingUser = User::where('firebase_uid', $uid)->first();
        if ($existingUser) {
            // On re-sync (login), don't overwrite status or role
            return response()->json([
                'message' => 'User synced successfully',
                'user'    => $existingUser->fresh(),
                'provider' => $existingUser->role === 'provider' ? $existingUser->providerProfile : null,
            ]);
        }

        // Create new user
        $user = User::create([
            'firebase_uid' => $uid,
            'name'         => $name,
            'email'        => $email,
            'role'         => $role,
            'phone'        => $phone,
            'status'       => $status,
        ]);

        // If this is a provider, create the provider profile with onboarding data
        if ($role === 'provider') {
            $services = $request->input('services', []);
            $consultationFee = (int) $request->input('consultation_fee', 0);

            // Every provider must offer at least General Consultation — auto-inject if missing.
            $hasGeneral = collect($services)->contains(function ($s) {
                return str_contains(strtolower($s['name'] ?? ''), 'general consult');
            });
            if (!$hasGeneral) {
                // Default price: lowest existing service price > consultation_fee > 1000
                $lowest = collect($services)
                    ->map(fn ($s) => (int) preg_replace('/[^\d]/', '', (string) ($s['price'] ?? '')))
                    ->filter(fn ($n) => $n > 0)
                    ->min();
                $price = $lowest ?: ($consultationFee ?: 1000);
                $services[] = ['name' => 'General Consultation', 'price' => (string) $price, 'duration' => '30 min'];
            }

            Provider::create([
                'user_id'                 => (string) $user->_id,
                'name'                    => $name,
                'email'                   => $email,
                'phone'                   => $phone,
                'service_type'            => $request->input('service_type', 'advocate'),
                'specialization'          => $request->input('specialization', 'General Practice'),
                'bar_council_id'          => $request->input('bar_council_id', ''),
                'location'                => $request->input('location', ''),
                'experience'              => $request->input('experience', '0'),
                'bio'                     => $request->input('bio', ''),
                'price_range'             => $request->input('price_range', ''),
                'consultation_fee'        => $consultationFee,
                'languages'               => $request->input('languages', []),
                'availability'            => $request->input('availability', ''),
                'qualifications'          => $request->input('qualifications', []),
                'services'                => $services,
                'rating'                  => 0,
                'rating_count'            => 0,
                'review_count'            => 0,
                'is_verified'             => false,
                'status'                  => 'pending',
                'verification_documents'  => $request->input('verification_documents', []),
                'government_id'           => $request->input('government_id'),
                'profile_photo'           => $request->input('profile_photo'),
            ]);
        }

        return response()->json([
            'message'  => 'User synced successfully',
            'user'     => $user->fresh(),
            'provider' => $role === 'provider' ? $user->providerProfile : null,
        ]);
    }

    /**
     * Get the current user's status from MongoDB.
     * Called by frontend after Firebase auth to get role + approval status.
     */
    public function getStatus(Request $request)
    {
        $uid = $request->firebase_uid;

        if (!$uid) {
            return response()->json(['error' => 'No firebase UID found'], 401);
        }

        $user = User::where('firebase_uid', $uid)->first();

        if (!$user) {
            return response()->json(['error' => 'User not found in database'], 404);
        }

        $data = [
            'id'               => (string) $user->_id,
            'firebase_uid'     => $user->firebase_uid,
            'name'             => $user->name,
            'email'            => $user->email,
            'role'             => $user->role,
            'status'           => $user->status,
            'phone'            => $user->phone,
            'avatar_url'       => $user->avatar_url,
            'rejection_reason' => $user->rejection_reason,
            'created_at'       => $user->created_at,
        ];

        // Include provider profile if applicable
        if ($user->role === 'provider' && $user->providerProfile) {
            $data['provider'] = $user->providerProfile;
        }

        return response()->json($data);
    }

    /**
     * Admin login — bypasses Firebase, checks email/password directly against MongoDB.
     */
    public function adminLogin(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)
                     ->where('role', 'admin')
                     ->first();

        if (!$user) {
            return response()->json(['error' => 'Invalid admin credentials'], 401);
        }

        if (!password_verify($request->password, $user->password_hash)) {
            return response()->json(['error' => 'Invalid admin credentials'], 401);
        }

        // Generate a simple token (in production, use proper JWT or Sanctum)
        $token = bin2hex(random_bytes(32));

        // Store the token on the user for later verification
        $user->update(['admin_token' => $token]);

        return response()->json([
            'message' => 'Admin login successful',
            'token'   => $token,
            'user'    => [
                'id'     => (string) $user->_id,
                'name'   => $user->name,
                'email'  => $user->email,
                'role'   => 'admin',
                'status' => 'active',
            ],
        ]);
    }
}
