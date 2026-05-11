<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Provider;
use App\Models\Appointment;
use App\Models\Petition;

class AdminController extends Controller
{
    /**
     * Dashboard stats — counts, recent activity, and leaderboard.
     */
    public function dashboard(Request $request)
    {
        $totalUsers       = User::count();
        $totalCitizens    = User::where('role', 'citizen')->count();
        $totalProviders   = Provider::count();
        $pendingProviders = Provider::where('status', 'pending')->count();
        $approvedProviders = Provider::where('status', 'approved')->count();
        $rejectedProviders = Provider::where('status', 'rejected')->count();
        $totalAppointments = Appointment::count();
        $totalPetitions    = Petition::count();

        // Recent registrations (last 10)
        $recentUsers = User::orderBy('created_at', 'desc')
                           ->take(10)
                           ->get(['name', 'email', 'role', 'status', 'created_at']);

        // Recent provider applications (last 5 pending) — include _id for approve/reject
        $recentPending = Provider::where('status', 'pending')
                                 ->orderBy('created_at', 'desc')
                                 ->take(5)
                                 ->get(['_id', 'name', 'email', 'service_type', 'location', 'created_at']);

        // Provider Leaderboard — top 10 by rating
        $leaderboard = Provider::where('status', 'approved')
                               ->orderBy('rating', 'desc')
                               ->orderBy('review_count', 'desc')
                               ->take(10)
                               ->get(['_id', 'name', 'email', 'specialization', 'location', 'rating', 'review_count', 'service_type', 'experience']);

        return response()->json([
            'stats' => [
                'total_users'        => $totalUsers,
                'total_citizens'     => $totalCitizens,
                'total_providers'    => $totalProviders,
                'pending_providers'  => $pendingProviders,
                'approved_providers' => $approvedProviders,
                'rejected_providers' => $rejectedProviders,
                'total_appointments' => $totalAppointments,
                'total_petitions'    => $totalPetitions,
            ],
            'recent_users'   => $recentUsers,
            'recent_pending' => $recentPending,
            'leaderboard'    => $leaderboard,
        ]);
    }

    /**
     * List all providers, optionally filtered by status.
     */
    public function providers(Request $request)
    {
        $status = $request->query('status'); // 'pending', 'approved', 'rejected', or null for all

        $query = Provider::with('user')->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        return response()->json($query->get());
    }

    /**
     * Approve a provider application.
     */
    public function approveProvider(Request $request, $id)
    {
        $provider = Provider::find($id);

        if (!$provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        $provider->update([
            'status'      => 'approved',
            'is_verified' => true,
        ]);

        // Also update the user status
        $user = User::find($provider->user_id);
        if ($user) {
            $user->update(['status' => 'approved']);
        }

        return response()->json([
            'message'  => 'Provider approved successfully',
            'provider' => $provider->fresh(),
        ]);
    }

    /**
     * Reject a provider application.
     */
    public function rejectProvider(Request $request, $id)
    {
        $provider = Provider::find($id);

        if (!$provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        $reason = $request->input('reason', 'Application does not meet requirements');

        $provider->update([
            'status'           => 'rejected',
            'rejection_reason' => $reason,
        ]);

        // Also update the user status
        $user = User::find($provider->user_id);
        if ($user) {
            $user->update([
                'status'           => 'rejected',
                'rejection_reason' => $reason,
            ]);
        }

        return response()->json([
            'message'  => 'Provider rejected',
            'provider' => $provider->fresh(),
        ]);
    }

    /**
     * List all users.
     */
    public function users(Request $request)
    {
        $role = $request->query('role');

        $query = User::orderBy('created_at', 'desc');

        if ($role) {
            $query->where('role', $role);
        }

        return response()->json($query->get(['_id', 'name', 'email', 'role', 'status', 'phone', 'created_at']));
    }

    /**
     * Provider leaderboard — returns top providers for standalone leaderboard view.
     */
    public function leaderboard(Request $request)
    {
        $providers = Provider::where('status', 'approved')
                             ->orderBy('rating', 'desc')
                             ->orderBy('review_count', 'desc')
                             ->take(20)
                             ->get(['_id', 'name', 'email', 'specialization', 'location', 'rating', 'review_count', 'service_type', 'experience', 'badges']);

        return response()->json($providers);
    }

    /**
     * Delete a provider and their associated user account.
     */
    public function deleteProvider(Request $request, $id)
    {
        $provider = Provider::find($id);
        if (!$provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        // Delete associated user account
        if ($provider->user_id) {
            User::where('_id', $provider->user_id)->delete();
        }
        
        $provider->delete();

        return response()->json(['message' => 'Provider deleted successfully']);
    }

    /**
     * Delete a user account (citizen or other roles).
     */
    public function deleteUser(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // If the user is a provider, delete their provider record too
        if ($user->role === 'provider') {
            Provider::where('user_id', (string) $user->_id)->delete();
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
