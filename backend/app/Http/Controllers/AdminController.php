<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\Provider;
use App\Models\Appointment;
use App\Models\Petition;
use App\Models\Transaction;
use App\Mail\ProviderApproved;
use App\Mail\ProviderRejected;

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

        // Send approval email (silently fails if mail not configured)
        try {
            Mail::to($provider->email)->send(new ProviderApproved($provider->name));
        } catch (\Throwable) {}

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

        // Send rejection email (silently fails if mail not configured)
        try {
            Mail::to($provider->email)->send(new ProviderRejected($provider->name, $reason));
        } catch (\Throwable) {}

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

    /**
     * GET /admin/providers/{id}/stats
     * Returns enriched provider stats for the admin profile modal.
     */
    public function providerStats(Request $request, $id)
    {
        // Accept either a provider's own _id OR the associated user's _id
        $provider = Provider::find($id) ?? Provider::where('user_id', $id)->first();
        if (!$provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        $pid = (string) $provider->_id;

        $casesClosed   = Appointment::where('provider_id', $pid)->where('status', 'completed')->count();
        $totalEarned   = Transaction::where('provider_id', $pid)->where('status', 'cleared')->sum('amount');
        $pendingEscrow = Transaction::where('provider_id', $pid)->where('status', 'pending')->sum('amount');
        $transactions  = Transaction::where('provider_id', $pid)->orderBy('created_at', 'desc')->limit(10)->get();

        // Compute actual badges
        $badges = [];
        if (($provider->rating ?? 0) >= 4.5) $badges[] = 'Top Rated Advocate';
        if ($casesClosed >= 10) $badges[] = 'Flawless Record';

        // Leaderboard position
        $allProviders = Provider::where('status', 'approved')
            ->orderBy('rating', 'desc')
            ->orderBy('review_count', 'desc')
            ->get(['_id']);
        $leaderboardPosition = null;
        foreach ($allProviders as $idx => $p) {
            if ((string) $p->_id === $pid) {
                $leaderboardPosition = $idx + 1;
                break;
            }
        }

        $tier = match (true) {
            $casesClosed >= 50 => 'Tier V',
            $casesClosed >= 30 => 'Tier IV',
            $casesClosed >= 15 => 'Tier III',
            $casesClosed >= 5  => 'Tier II',
            default            => 'Tier I',
        };

        return response()->json([
            'provider'           => $provider,
            'casesClosed'        => $casesClosed,
            'totalEarned'        => $totalEarned,
            'pendingEscrow'      => $pendingEscrow,
            'recentTransactions' => $transactions,
            'badges'             => $badges,
            'tier'               => $tier,
            'leaderboardPosition'=> $leaderboardPosition,
        ]);
    }

    /**
     * POST /admin/providers/{id}/award
     * Award a performance bonus directly to a provider's ledger.
     */
    public function awardProvider(Request $request, $id)
    {
        $provider = Provider::find($id) ?? Provider::where('user_id', $id)->first();
        if (!$provider) {
            return response()->json(['error' => 'Provider not found'], 404);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1|max:1000000',
            'reason' => 'required|string|max:255',
        ]);

        Transaction::create([
            'transaction_id' => 'AWD-' . rand(1000, 9999),
            'provider_id'    => (string) $provider->_id,
            'client_name'    => 'Admin Award',
            'type'           => $validated['reason'],
            'amount'         => (float) $validated['amount'],
            'status'         => 'cleared',
            'date'           => now()->toDateString(),
        ]);

        return response()->json([
            'message' => "₹{$validated['amount']} awarded to {$provider->name} successfully.",
        ]);
    }
}
