<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\Provider;
use App\Models\Appointment;
use App\Models\Petition;
use App\Models\Transaction;
use App\Models\Complaint;
use App\Models\ProviderNotice;
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
        $openComplaints    = Complaint::whereIn('status', ['open', 'under-review'])->count();
        $highSeverityOpen  = Complaint::whereIn('status', ['open', 'under-review'])
                                       ->where('severity', 'high')->count();

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
                'open_complaints'    => $openComplaints,
                'high_severity_open' => $highSeverityOpen,
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

        $casesClosed   = Petition::where('provider_id', $pid)->whereIn('status', ['resolved', 'closed'])->count();
        $totalEarned   = Transaction::where('provider_id', $pid)->where('status', 'cleared')->sum('amount');
        $heldInEscrow  = Transaction::where('provider_id', $pid)->where('status', 'escrow')->sum('amount');
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
            'heldInEscrow'       => $heldInEscrow,
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

    /**
     * GET /admin/escrow
     * Returns all escrow transactions enriched with linked-case status so the admin
     * can decide whether release is allowed (only resolved/closed cases qualify).
     */
    public function escrowTransactions(Request $request)
    {
        $rows = Transaction::where('status', 'escrow')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) {
                $petition = null;
                if (!empty($t->petition_id)) {
                    $petition = Petition::find($t->petition_id);
                }
                $appointment = null;
                if (!empty($t->appointment_id)) {
                    $appointment = Appointment::find($t->appointment_id);
                }
                $provider = Provider::find($t->provider_id);

                $caseStatus = $petition->status ?? null;
                $releasable = $caseStatus && in_array($caseStatus, ['resolved', 'closed'], true);

                return [
                    '_id'              => (string) $t->_id,
                    'transaction_id'   => $t->transaction_id,
                    'amount'           => (float) $t->amount,
                    'type'             => $t->type,
                    'date'             => $t->date,
                    'client_name'      => $t->client_name,
                    'provider_id'      => $t->provider_id,
                    'provider_name'    => $provider->name ?? '—',
                    'petition_id'      => $t->petition_id,
                    'petition_code'    => $t->petition_code ?? ($petition->petition_id ?? null),
                    'case_status'      => $caseStatus,
                    'consultation_date'=> $appointment->date ?? null,
                    'releasable'       => $releasable,
                ];
            });

        $totalHeld    = $rows->sum('amount');
        $releasable   = $rows->where('releasable', true)->count();
        $blocked      = $rows->where('releasable', false)->count();

        return response()->json([
            'transactions' => $rows->values(),
            'summary'      => [
                'count'         => $rows->count(),
                'totalHeld'     => $totalHeld,
                'releasable'    => $releasable,
                'blockedByCase' => $blocked,
            ],
        ]);
    }

    /**
     * POST /admin/transactions/{id}/release
     * Moves a transaction from escrow to cleared. Guarded: the linked case must
     * be resolved or closed.
     */
    public function releaseEscrow(Request $request, $id)
    {
        $transaction = Transaction::find($id);
        if (!$transaction) {
            return response()->json(['error' => 'Transaction not found'], 404);
        }
        if ($transaction->status !== 'escrow') {
            return response()->json(['error' => 'Only escrow transactions can be released.'], 422);
        }

        // Verify the linked case is resolved or closed before releasing funds.
        if (!empty($transaction->petition_id)) {
            $petition = Petition::find($transaction->petition_id);
            if ($petition && !in_array($petition->status, ['resolved', 'closed'], true)) {
                return response()->json([
                    'error' => "Cannot release — case {$petition->petition_id} is still {$petition->status}. Funds can only be released after the provider resolves the case.",
                ], 422);
            }

            // Block release if an unresolved complaint is attached to the case.
            $blockingComplaint = Complaint::where('petition_id', (string) $transaction->petition_id)
                ->whereIn('status', ['open', 'under-review'])
                ->first();
            if ($blockingComplaint) {
                return response()->json([
                    'error' => "Cannot release — complaint {$blockingComplaint->complaint_id} is {$blockingComplaint->status}. Resolve or dismiss the complaint before releasing funds.",
                ], 422);
            }
        }

        $transaction->update([
            'status'      => 'cleared',
            'released_at' => now()->toISOString(),
        ]);

        return response()->json([
            'message'     => 'Funds released to provider ledger.',
            'transaction' => $transaction->fresh(),
        ]);
    }

    // ── Complaint moderation ─────────────────────────────────────

    /**
     * GET /admin/complaints
     * Listing with optional status filter + summary counts for the dashboard.
     */
    public function complaints(Request $request)
    {
        $status   = $request->query('status');
        $severity = $request->query('severity');

        $query = Complaint::orderBy('created_at', 'desc');
        if ($status)   { $query->where('status', $status); }
        if ($severity) { $query->where('severity', $severity); }

        $rows = $query->get();

        $summary = [
            'total'         => Complaint::count(),
            'open'          => Complaint::where('status', 'open')->count(),
            'under_review'  => Complaint::where('status', 'under-review')->count(),
            'resolved'      => Complaint::where('status', 'resolved')->count(),
            'dismissed'     => Complaint::where('status', 'dismissed')->count(),
            'high_severity' => Complaint::where('severity', 'high')
                                ->whereIn('status', ['open', 'under-review'])->count(),
        ];

        return response()->json([
            'complaints' => $rows,
            'summary'    => $summary,
        ]);
    }

    /**
     * GET /admin/complaints/{id}
     * Enriched detail view — linked petition, transaction, provider, citizen.
     */
    public function complaintDetail(Request $request, $id)
    {
        $complaint = Complaint::find($id);
        if (!$complaint) {
            return response()->json(['error' => 'Complaint not found'], 404);
        }

        $petition    = $complaint->petition_id    ? Petition::find($complaint->petition_id)       : null;
        $appointment = $complaint->appointment_id ? Appointment::find($complaint->appointment_id) : null;
        $transaction = $complaint->transaction_id ? Transaction::find($complaint->transaction_id) : null;
        $provider    = Provider::find($complaint->provider_id);
        $citizen     = User::find($complaint->citizen_id);

        return response()->json([
            'complaint'   => $complaint,
            'petition'    => $petition,
            'appointment' => $appointment,
            'transaction' => $transaction,
            'provider'    => $provider ? [
                '_id'            => (string) $provider->_id,
                'name'           => $provider->name,
                'email'          => $provider->email,
                'phone'          => $provider->phone,
                'service_type'   => $provider->service_type,
                'specialization' => $provider->specialization,
                'location'       => $provider->location,
                'rating'         => $provider->rating,
                'status'         => $provider->status,
            ] : null,
            'citizen' => $citizen ? [
                '_id'   => (string) $citizen->_id,
                'name'  => $citizen->name,
                'email' => $citizen->email,
                'phone' => $citizen->phone,
            ] : null,
        ]);
    }

    /**
     * PUT /admin/complaints/{id}/status
     * Transition complaint between open / under-review / resolved / dismissed.
     */
    public function updateComplaintStatus(Request $request, $id)
    {
        $complaint = Complaint::find($id);
        if (!$complaint) {
            return response()->json(['error' => 'Complaint not found'], 404);
        }

        $validated = $request->validate([
            'status'         => 'required|in:open,under-review,resolved,dismissed',
            'note'           => 'nullable|string|max:1000',
            'release_escrow' => 'nullable|boolean',
        ]);

        $actions = $complaint->actions_log ?? [];
        $actions[] = [
            'action'    => 'status-' . $validated['status'],
            'note'      => $validated['note'] ?? "Status changed to {$validated['status']}.",
            'timestamp' => now()->toISOString(),
        ];

        $updates = [
            'status'      => $validated['status'],
            'actions_log' => $actions,
        ];

        if (in_array($validated['status'], ['resolved', 'dismissed'], true)) {
            $updates['resolved_at'] = now()->toISOString();
        }

        // Optional escrow release — only meaningful when closing the complaint.
        $releaseInfo = null;
        $shouldRelease = ($validated['release_escrow'] ?? false)
            && in_array($validated['status'], ['resolved', 'dismissed'], true)
            && !empty($complaint->transaction_id);

        if ($shouldRelease) {
            $transaction = Transaction::find($complaint->transaction_id);
            if ($transaction && $transaction->status === 'escrow') {
                $transaction->update([
                    'status'      => 'cleared',
                    'released_at' => now()->toISOString(),
                ]);

                // Append a fresh action entry recording the release.
                $updates['actions_log'][] = [
                    'action'    => 'escrow-released',
                    'note'      => 'Held escrow released after complaint review.',
                    'timestamp' => now()->toISOString(),
                ];

                $releaseInfo = [
                    'transaction_id' => $transaction->transaction_id,
                    'amount'         => (float) $transaction->amount,
                ];
            }
        }

        $complaint->update($updates);

        return response()->json([
            'message'   => $releaseInfo
                ? 'Complaint status updated and held escrow released.'
                : 'Complaint status updated.',
            'complaint' => $complaint->fresh(),
            'release'   => $releaseInfo,
        ]);
    }

    /**
     * POST /admin/complaints/{id}/notes
     * Append an internal moderation note. Never shown to providers.
     */
    public function addComplaintNote(Request $request, $id)
    {
        $complaint = Complaint::find($id);
        if (!$complaint) {
            return response()->json(['error' => 'Complaint not found'], 404);
        }

        $validated = $request->validate([
            'note' => 'required|string|min:1|max:1000',
        ]);

        $notes = $complaint->admin_notes ?? [];
        $notes[] = [
            'note'      => $validated['note'],
            'timestamp' => now()->toISOString(),
        ];

        $complaint->update(['admin_notes' => $notes]);

        return response()->json([
            'message'   => 'Note added.',
            'complaint' => $complaint->fresh(),
        ]);
    }

    /**
     * POST /admin/complaints/{id}/warn-provider
     * Logs an internal moderation note on the complaint AND publishes a
     * generic compliance notice to the provider's notices feed.
     * The notice never reveals complaint IDs, citizen names, or case context.
     */
    public function warnProvider(Request $request, $id)
    {
        $complaint = Complaint::find($id);
        if (!$complaint) {
            return response()->json(['error' => 'Complaint not found'], 404);
        }

        $validated = $request->validate([
            'reason'        => 'required|string|min:5|max:500',
            'guidance_note' => 'nullable|string|max:500',
        ]);

        $actions = $complaint->actions_log ?? [];
        $actions[] = [
            'action'    => 'provider-warned',
            'note'      => $validated['reason'],
            'timestamp' => now()->toISOString(),
        ];
        $complaint->update(['actions_log' => $actions]);

        // Reuse an existing active notice for this complaint if present,
        // otherwise create a fresh one. The text is intentionally generic.
        $notice = ProviderNotice::where('complaint_id', (string) $complaint->_id)
            ->whereIn('status', ['active', 'acknowledged'])
            ->first();
        if ($notice) {
            // If a notice already exists for this complaint, update the guidance note
            // (the reason itself remains admin-private).
            if (!empty($validated['guidance_note'])) {
                $notice->update(['guidance_note' => $validated['guidance_note']]);
            }
        } else {
            ProviderNotice::create([
                'provider_id'   => (string) $complaint->provider_id,
                'complaint_id'  => (string) $complaint->_id,
                'type'          => 'warning',
                'severity'      => $complaint->severity ?? 'medium',
                'message'       => 'A recent engagement was flagged for quality review. '
                                 . 'Please continue to maintain Lexium\'s professional standards. '
                                 . 'Repeated compliance flags may affect your marketplace standing.',
                'guidance_note' => $validated['guidance_note'] ?? null,
                'status'        => 'active',
                'acknowledged'  => false,
            ]);
        }

        return response()->json([
            'message'   => 'Compliance warning issued — generic notice sent to provider.',
            'complaint' => $complaint->fresh(),
        ]);
    }

    /**
     * POST /admin/notices/{id}/clear
     * Mark a single provider notice as cleared (no longer surfaced to provider).
     */
    public function clearProviderNotice(Request $request, $id)
    {
        $notice = ProviderNotice::find($id);
        if (!$notice) {
            return response()->json(['error' => 'Notice not found'], 404);
        }

        if (in_array($notice->status ?? 'active', ['cleared', 'archived'], true)) {
            return response()->json(['error' => 'Notice already cleared.'], 422);
        }

        $admin = $request->input('admin_user');
        $notice->update([
            'status'     => 'cleared',
            'cleared_at' => now()->toISOString(),
            'cleared_by' => $admin->name ?? 'Lexium Compliance',
        ]);

        return response()->json([
            'message' => 'Notice cleared.',
            'notice'  => $notice->fresh(),
        ]);
    }

    /**
     * POST /admin/notices/{id}/archive
     * Soft-archive a provider notice (admin-only history).
     */
    public function archiveProviderNotice(Request $request, $id)
    {
        $notice = ProviderNotice::find($id);
        if (!$notice) {
            return response()->json(['error' => 'Notice not found'], 404);
        }

        $notice->update(['status' => 'archived']);

        return response()->json([
            'message' => 'Notice archived.',
            'notice'  => $notice->fresh(),
        ]);
    }

    /**
     * POST /admin/providers/{id}/notices/clear-all
     * Clear every active/acknowledged notice for a provider — used when
     * compliance is restored after a successful intervention.
     */
    public function clearAllProviderNotices(Request $request, $id)
    {
        $provider = Provider::find($id) ?? Provider::where('user_id', $id)->first();
        $providerId = $provider ? (string) $provider->_id : (string) $id;

        $admin = $request->input('admin_user');
        $clearedBy = $admin->name ?? 'Lexium Compliance';

        $affected = ProviderNotice::where('provider_id', $providerId)
            ->whereIn('status', ['active', 'acknowledged'])
            ->update([
                'status'     => 'cleared',
                'cleared_at' => now()->toISOString(),
                'cleared_by' => $clearedBy,
            ]);

        return response()->json([
            'message'   => "Cleared {$affected} notice(s) for this provider.",
            'cleared'   => $affected,
        ]);
    }

    /**
     * POST /admin/complaints/{id}/deduct
     * Create a negative-amount cleared transaction against the provider's ledger.
     * The provider sees a numeric line; the complaint context stays admin-only.
     */
    public function deductEarnings(Request $request, $id)
    {
        $complaint = Complaint::find($id);
        if (!$complaint) {
            return response()->json(['error' => 'Complaint not found'], 404);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1|max:1000000',
            'reason' => 'required|string|max:255',
        ]);

        $deduction = Transaction::create([
            'transaction_id' => 'ADJ-' . rand(1000, 9999),
            'provider_id'    => (string) $complaint->provider_id,
            'client_name'    => 'Compliance Adjustment',
            'type'           => 'Compliance Adjustment',
            'amount'         => -1 * (float) $validated['amount'],
            'status'         => 'cleared',
            'date'           => now()->toDateString(),
            'released_at'    => now()->toISOString(),
        ]);

        $actions = $complaint->actions_log ?? [];
        $actions[] = [
            'action'    => 'earnings-deducted',
            'note'      => "₹{$validated['amount']} adjustment — {$validated['reason']}",
            'timestamp' => now()->toISOString(),
        ];
        $complaint->update(['actions_log' => $actions]);

        // A ledger deduction is itself a strong signal — suppress any
        // pending generic notice for the same complaint to avoid
        // double-communicating the same incident.
        ProviderNotice::where('complaint_id', (string) $complaint->_id)
            ->where('acknowledged', false)
            ->delete();

        return response()->json([
            'message'     => "₹{$validated['amount']} deducted from provider ledger.",
            'transaction' => $deduction,
            'complaint'   => $complaint->fresh(),
        ]);
    }

    /**
     * POST /admin/complaints/{id}/hold-escrow
     * Explicit escrow hold — escalates complaint to under-review which
     * automatically blocks releaseEscrow() for any linked transaction.
     */
    public function holdEscrow(Request $request, $id)
    {
        $complaint = Complaint::find($id);
        if (!$complaint) {
            return response()->json(['error' => 'Complaint not found'], 404);
        }

        if (in_array($complaint->status, ['resolved', 'dismissed'], true)) {
            return response()->json([
                'error' => 'Cannot place a hold on a complaint that is already closed.',
            ], 422);
        }

        $actions = $complaint->actions_log ?? [];
        $actions[] = [
            'action'    => 'escrow-held',
            'note'      => 'Admin placed an explicit escrow hold on this complaint.',
            'timestamp' => now()->toISOString(),
        ];

        $complaint->update([
            'status'      => 'under-review',
            'actions_log' => $actions,
        ]);

        return response()->json([
            'message'   => 'Escrow hold placed — linked transactions cannot be released until this complaint is resolved or dismissed.',
            'complaint' => $complaint->fresh(),
        ]);
    }

    /**
     * GET /admin/providers/{id}/complaint-history
     * Aggregated complaint statistics for a provider, plus a flat list of
     * recent complaints. Drives the admin's "Elevated Monitoring" indicator.
     */
    public function providerComplaintHistory(Request $request, $id)
    {
        // Accept either the provider's own _id OR the linked user_id.
        $provider = Provider::find($id) ?? Provider::where('user_id', $id)->first();
        $providerId = $provider ? (string) $provider->_id : (string) $id;

        $all          = Complaint::where('provider_id', $providerId)->get();
        $total        = $all->count();
        $unresolved   = $all->whereIn('status', ['open', 'under-review'])->count();
        $highSeverity = $all->where('severity', 'high')->count();
        $resolved     = $all->where('status', 'resolved')->count();
        $dismissed    = $all->where('status', 'dismissed')->count();

        // Warning aggregates — active vs cleared/archived buckets.
        $notices = ProviderNotice::where('provider_id', $providerId)->get();
        $activeWarnings  = $notices->whereIn('status', ['active', 'acknowledged'])->where('type', 'warning')->count();
        $clearedWarnings = $notices->whereIn('status', ['cleared', 'archived'])->where('type', 'warning')->count();
        $totalWarnings   = $notices->where('type', 'warning')->count();
        $lastWarningAt   = optional(
            $notices->where('type', 'warning')->sortByDesc('created_at')->first()
        )->created_at;

        // Escrow holds triggered (count of complaints with at least one escrow-held action).
        $escrowHoldsCount = $all->filter(function ($c) {
            $log = is_array($c->actions_log) ? $c->actions_log : [];
            foreach ($log as $entry) {
                if (($entry['action'] ?? null) === 'escrow-held') return true;
            }
            return false;
        })->count();

        // Most recent compliance action across all complaints for this provider.
        $lastComplianceAction = null;
        foreach ($all as $c) {
            foreach ((is_array($c->actions_log) ? $c->actions_log : []) as $entry) {
                $code = $entry['action'] ?? null;
                if (in_array($code, ['provider-warned', 'earnings-deducted', 'escrow-held', 'escrow-released'], true)) {
                    if (!$lastComplianceAction || ($entry['timestamp'] ?? '') > ($lastComplianceAction['timestamp'] ?? '')) {
                        $lastComplianceAction = [
                            'action'    => $code,
                            'timestamp' => $entry['timestamp'] ?? null,
                        ];
                    }
                }
            }
        }

        // Risk heuristic per spec: 3+ unresolved OR 2+ high-severity (any status).
        $riskFlag = ($unresolved >= 3) || ($highSeverity >= 2);

        // "Compliance Restored" — provider had warnings before but currently has none active.
        $complianceRestored = ($totalWarnings > 0) && ($activeWarnings === 0) && !$riskFlag;

        $standingNote = $riskFlag
            ? 'Provider has multiple unresolved or repeated high-severity complaints. Recommend close monitoring.'
            : ($complianceRestored
                ? 'Previous warnings have been cleared. Compliance has been restored.'
                : ($total === 0
                    ? 'No complaints on record. Provider is in good standing.'
                    : 'Complaint volume is within acceptable range.'));

        $standing = $riskFlag
            ? 'Elevated Monitoring'
            : ($complianceRestored ? 'Compliance Restored' : 'Good Standing');

        $recent = Complaint::where('provider_id', $providerId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['_id', 'complaint_id', 'issue_type', 'severity', 'status', 'petition_code', 'created_at'])
            ->map(function ($c) {
                return [
                    '_id'           => (string) $c->_id,
                    'complaint_id'  => $c->complaint_id,
                    'issue_type'    => $c->issue_type,
                    'severity'      => $c->severity,
                    'status'        => $c->status,
                    'petition_code' => $c->petition_code,
                    'created_at'    => $c->created_at,
                ];
            });

        $recentNotices = $notices
            ->sortByDesc('created_at')
            ->take(20)
            ->map(fn ($n) => [
                '_id'             => (string) $n->_id,
                'type'            => $n->type,
                'severity'        => $n->severity,
                'message'         => $n->message,
                'guidance_note'   => $n->guidance_note,
                'status'          => $n->status ?? 'active',
                'acknowledged'    => (bool) $n->acknowledged,
                'acknowledged_at' => $n->acknowledged_at,
                'cleared_at'      => $n->cleared_at,
                'cleared_by'      => $n->cleared_by,
                'created_at'      => $n->created_at,
            ])
            ->values();

        return response()->json([
            'provider_id'             => $providerId,
            'total'                   => $total,
            'unresolved'              => $unresolved,
            'high_severity'           => $highSeverity,
            'resolved'                => $resolved,
            'dismissed'               => $dismissed,
            'warning_count'           => $totalWarnings,
            'active_warnings'         => $activeWarnings,
            'cleared_warnings'        => $clearedWarnings,
            'last_warning_at'         => $lastWarningAt,
            'last_compliance_action'  => $lastComplianceAction,
            'escrow_holds_count'      => $escrowHoldsCount,
            'risk_flag'               => $riskFlag,
            'compliance_restored'     => $complianceRestored,
            'standing'                => $standing,
            'standing_note'           => $standingNote,
            'recent'                  => $recent,
            'recent_notices'          => $recentNotices,
        ]);
    }
}
