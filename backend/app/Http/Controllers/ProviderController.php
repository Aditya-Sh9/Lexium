<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Provider;
use App\Models\Appointment;
use App\Models\Petition;
use App\Models\Transaction;

class ProviderController extends Controller
{
    // ── Public routes ────────────────────────────────────────────

    public function index()
    {
        $providers = Provider::where('status', 'approved')
            ->orderBy('rating', 'desc')
            ->get();

        return response()->json($providers);
    }

    public function show($id)
    {
        $provider = Provider::find($id);
        if (!$provider) return response()->json(['error' => 'Provider not found'], 404);
        return response()->json($provider);
    }

    public function categories()
    {
        return response()->json([
            ['id' => 'advocate',        'name' => 'Advocate',        'description' => 'Licensed lawyers for civil, criminal, corporate, and family law matters.'],
            ['id' => 'mediator',        'name' => 'Mediator',        'description' => 'Neutral professionals helping parties reach mutually acceptable agreements.'],
            ['id' => 'arbitrator',      'name' => 'Arbitrator',      'description' => 'Resolve disputes outside court through binding arbitration proceedings.'],
            ['id' => 'notary',          'name' => 'Notary',          'description' => 'Authenticate documents, administer oaths, and certify legal papers.'],
            ['id' => 'document-writer', 'name' => 'Document Writer', 'description' => 'Draft legal documents, petitions, affidavits, and contracts.'],
            ['id' => 'tax-consultant',  'name' => 'Tax Consultant',  'description' => 'Expert advice on tax planning, GST compliance, and income tax matters.'],
        ]);
    }

    // ── Protected routes ─────────────────────────────────────────

    public function dashboard(Request $request)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $pid = (string) $provider->_id;

        // "Active Clients" = distinct citizens with an open case OR an upcoming appointment
        $citizenIdsFromCases = Petition::where('provider_id', $pid)
            ->whereIn('status', ['under-review', 'in-progress', 'awaiting-documents', 'accepted'])
            ->pluck('citizen_id')->toArray();
        $citizenIdsFromAppts = Appointment::where('provider_id', $pid)
            ->whereIn('status', ['confirmed', 'in-progress', 'pending'])
            ->pluck('citizen_id')->toArray();
        $activeClients = count(array_unique(array_merge($citizenIdsFromCases, $citizenIdsFromAppts)));

        $openCases    = Petition::where('provider_id', $pid)
            ->whereIn('status', ['under-review', 'in-progress', 'awaiting-documents', 'accepted'])->count();
        $newRequests  = Petition::where('provider_id', $pid)->where('status', 'pending')->count();

        $todayDocket = Appointment::where('provider_id', $pid)
            ->whereIn('status', ['pending', 'confirmed', 'in-progress'])
            ->orderBy('date', 'asc')->limit(5)->get();

        $escrowValue  = Transaction::where('provider_id', $pid)->where('status', 'escrow')->sum('amount');
        $clearedValue = Transaction::where('provider_id', $pid)->where('status', 'cleared')->sum('amount');
        $casesClosed  = Petition::where('provider_id', $pid)->whereIn('status', ['resolved', 'closed'])->count();

        // Count actually earned badges
        $badgesEarned = 0;
        if (($provider->rating ?? 0) >= 4.5) $badgesEarned++;
        if ($casesClosed >= 10) $badgesEarned++;

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

        // Recent reviews (last 3 from Provider.reviews array)
        $reviews = is_array($provider->reviews) ? $provider->reviews : [];
        $recentReviews = array_slice(array_reverse($reviews), 0, 3);

        // Weekly appointments count
        $weeklyApts = Appointment::where('provider_id', $pid)
            ->where('date', '>=', now()->startOfWeek()->toDateString())
            ->where('date', '<=', now()->endOfWeek()->toDateString())
            ->count();

        return response()->json([
            'standing'           => ($provider->rating ?? 0) >= 4.5 ? 'Exemplary' : 'Good',
            'activeClients'      => $activeClients,
            'openCases'          => $openCases,
            'newRequests'        => $newRequests,
            'weeklyApts'         => $weeklyApts,
            'badgesEarned'       => $badgesEarned,
            'leaderboardPosition'=> $leaderboardPosition,
            'todayDocket'        => $todayDocket,
            'recentReviews'      => $recentReviews,
            'accruedValue'       => [
                'escrow'       => $escrowValue,
                'cleared'      => $clearedValue,
                'monthlyTotal' => $escrowValue + $clearedValue,
            ],
            'pathProgress' => ['casesClosed' => $casesClosed, 'proBono' => 0],
        ]);
    }

    public function docket(Request $request)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $pid = (string) $provider->_id;

        return response()->json([
            'petitions'   => Petition::where('provider_id', $pid)->where('status', 'pending')
                ->orderBy('created_at', 'desc')->get(),
            'activeCases' => Appointment::where('provider_id', $pid)
                ->whereIn('status', ['confirmed', 'in-progress', 'pending'])
                ->orderBy('date', 'asc')->get(),
            'activePetitions' => Petition::where('provider_id', $pid)
                ->whereIn('status', ['under-review', 'in-progress', 'awaiting-documents', 'accepted'])
                ->orderBy('updated_at', 'desc')->get(),
        ]);
    }

    public function ledger(Request $request)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $pid = (string) $provider->_id;

        return response()->json([
            'clearedValue' => Transaction::where('provider_id', $pid)->where('status', 'cleared')->sum('amount'),
            'escrowValue'  => Transaction::where('provider_id', $pid)->where('status', 'escrow')->sum('amount'),
            'transactions' => Transaction::where('provider_id', $pid)->orderBy('created_at', 'desc')->limit(50)->get(),
        ]);
    }

    public function eminence(Request $request)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $pid = (string) $provider->_id;
        $casesClosed = Petition::where('provider_id', $pid)->whereIn('status', ['resolved', 'closed'])->count();
        $reviewCount = $provider->review_count ?? 0;
        $ratingAvg   = $provider->rating ?? 0;

        $tier = match (true) {
            $casesClosed >= 50 => 'Tier V',
            $casesClosed >= 30 => 'Tier IV',
            $casesClosed >= 15 => 'Tier III',
            $casesClosed >= 5  => 'Tier II',
            default            => 'Tier I',
        };

        $badges = [
            ['id' => 1, 'name' => 'Top Rated Advocate', 'icon' => 'star',   'earned' => $ratingAvg >= 4.5],
            ['id' => 2, 'name' => 'Flawless Record',    'icon' => 'shield', 'earned' => $casesClosed >= 10],
            ['id' => 3, 'name' => 'Pro Bono Champion',  'icon' => 'award',  'earned' => false],
        ];

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

        return response()->json([
            'tier'               => $tier,
            'standing'           => $ratingAvg >= 4.5 ? 'Exemplary' : 'Good',
            'casesClosed'        => $casesClosed,
            'proBonoCompleted'   => 0,
            'ratingAvg'          => $ratingAvg,
            'reviewCount'        => $reviewCount,
            'leaderboardPosition'=> $leaderboardPosition,
            'badges'             => $badges,
        ]);
    }

    public function profile(Request $request)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);
        return response()->json($provider);
    }

    public function updateProfile(Request $request)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $provider->update($request->only([
            'name', 'service_type', 'specialization', 'bar_council_id',
            'location', 'experience', 'bio', 'price_range',
            'consultation_fee', 'availability', 'services'
        ]));

        return response()->json(['message' => 'Profile updated successfully', 'provider' => $provider->fresh()]);
    }

    // ── Petition Actions ─────────────────────────────────────────

    public function acceptPetition(Request $request, $id)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $petition = Petition::where('_id', $id)->where('provider_id', (string) $provider->_id)->first();
        if (!$petition) return response()->json(['error' => 'Petition not found'], 404);

        // Provider may optionally override scheduled date/time when accepting
        $validated = $request->validate([
            'scheduled_date' => 'nullable|string',
            'scheduled_time' => 'nullable|string',
        ]);

        // Resolve consultation date/time: provider-chosen > citizen-preferred > default (3 days out, 10am)
        $consultDate = $validated['scheduled_date']
            ?? $petition->preferred_date
            ?? now()->addDays(3)->toDateString();
        $consultTime = $validated['scheduled_time']
            ?? $petition->preferred_time
            ?? '10:00 AM';

        $timeline = $petition->timeline ?? [];
        $timeline[] = [
            'action'    => 'accepted',
            'note'      => "Case accepted by provider. Consultation scheduled for {$consultDate} at {$consultTime}.",
            'timestamp' => now()->toISOString(),
        ];

        $petition->update([
            'status'    => 'under-review',
            'next_step' => "Provider has accepted your case. Your consultation is scheduled for {$consultDate} at {$consultTime}.",
            'timeline'  => $timeline,
        ]);

        $appointment = Appointment::create([
            'citizen_id'    => $petition->citizen_id,
            'citizen_name'  => $petition->citizen_name,
            'provider_id'   => $petition->provider_id,
            'provider_name' => $petition->provider_name,
            'petition_id'   => (string) $petition->_id,
            'petition_code' => $petition->petition_id,
            'type'          => $petition->type,
            'date'          => $consultDate,
            'time'          => $consultTime,
            'status'        => 'confirmed',
            'notes'         => 'Consultation linked to case ' . $petition->petition_id,
            'reviewed'      => false,
        ]);

        return response()->json([
            'message'     => 'Case accepted — consultation scheduled',
            'petition'    => $petition->fresh(),
            'appointment' => $appointment,
        ]);
    }

    public function declinePetition(Request $request, $id)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $petition = Petition::where('_id', $id)->where('provider_id', (string) $provider->_id)->first();
        if (!$petition) return response()->json(['error' => 'Petition not found'], 404);

        $reason = $request->input('reason', 'The provider has declined this request.');

        $timeline = $petition->timeline ?? [];
        $timeline[] = [
            'action'    => 'declined',
            'note'      => $reason,
            'timestamp' => now()->toISOString(),
        ];

        $petition->update([
            'status'         => 'declined',
            'next_step'      => 'You may reach out to another practitioner.',
            'provider_notes' => $reason,
            'timeline'       => $timeline,
        ]);

        return response()->json(['message' => 'Petition declined']);
    }

    /**
     * PUT /provider/petitions/{id}/status
     * Update petition status and optionally add a provider note.
     */
    public function updatePetitionStatus(Request $request, $id)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $petition = Petition::where('_id', $id)->where('provider_id', (string) $provider->_id)->first();
        if (!$petition) return response()->json(['error' => 'Petition not found'], 404);

        $validated = $request->validate([
            'status' => 'required|in:under-review,in-progress,awaiting-documents,resolved,closed',
            'note'   => 'nullable|string|max:500',
        ]);

        $nextStepMap = [
            'under-review'        => 'Provider is reviewing your case details.',
            'in-progress'         => 'Your case is actively being worked on.',
            'awaiting-documents'  => 'Please submit the required documents to proceed.',
            'resolved'            => 'Your case has been resolved. Please confirm closure.',
            'closed'              => 'This case is now closed.',
        ];

        $timeline = $petition->timeline ?? [];
        $timeline[] = [
            'action'    => $validated['status'],
            'note'      => $validated['note'] ?? $nextStepMap[$validated['status']],
            'timestamp' => now()->toISOString(),
        ];

        $updates = [
            'status'    => $validated['status'],
            'next_step' => $nextStepMap[$validated['status']],
            'timeline'  => $timeline,
        ];

        if (!empty($validated['note'])) {
            $updates['provider_notes'] = $validated['note'];
        }

        $petition->update($updates);

        return response()->json(['message' => 'Petition status updated', 'petition' => $petition->fresh()]);
    }

    // ── Appointment Actions ──────────────────────────────────────

    public function acceptAppointment(Request $request, $id)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $appointment = Appointment::where('_id', $id)->where('provider_id', (string) $provider->_id)->first();
        if (!$appointment) return response()->json(['error' => 'Appointment not found'], 404);

        $appointment->update(['status' => 'confirmed']);
        return response()->json(['message' => 'Appointment accepted']);
    }

    public function declineAppointment(Request $request, $id)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $appointment = Appointment::where('_id', $id)->where('provider_id', (string) $provider->_id)->first();
        if (!$appointment) return response()->json(['error' => 'Appointment not found'], 404);

        $appointment->update(['status' => 'declined']);
        return response()->json(['message' => 'Appointment declined']);
    }

    /**
     * PUT /provider/appointments/{id}/complete
     * Mark appointment complete and auto-create a transaction using provider's fee.
     */
    public function completeAppointment(Request $request, $id)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $appointment = Appointment::where('_id', $id)
            ->where('provider_id', (string) $provider->_id)
            ->first();

        if (!$appointment) return response()->json(['error' => 'Appointment not found'], 404);

        $appointment->update(['status' => 'completed']);

        // Resolve transaction amount: linked petition's quoted_price > provider.consultation_fee > 0
        $amount = null;
        $linkedPetition = null;
        if (!empty($appointment->petition_id)) {
            $linkedPetition = Petition::find($appointment->petition_id);
            if ($linkedPetition && $linkedPetition->quoted_price) {
                $amount = (float) $linkedPetition->quoted_price;
            }
        }
        if ($amount === null) {
            $amount = (float) ($provider->consultation_fee ?: 0);
        }

        // Funds go into ESCROW — admin must release them after the case is resolved/closed.
        Transaction::create([
            'transaction_id' => 'TRX-' . rand(1000, 9999),
            'provider_id'    => (string) $provider->_id,
            'client_name'    => $appointment->citizen_name,
            'petition_id'    => $linkedPetition ? (string) $linkedPetition->_id : ($appointment->petition_id ?? null),
            'petition_code'  => $linkedPetition->petition_id ?? ($appointment->petition_code ?? null),
            'appointment_id' => (string) $appointment->_id,
            'type'           => $appointment->type,
            'amount'         => $amount,
            'status'         => 'escrow',
            'date'           => now()->toDateString(),
        ]);

        // Log the consultation event on related open cases — but do NOT auto-resolve them.
        // The case remains active until the provider explicitly progresses it via updatePetitionStatus().
        Petition::where('citizen_id', $appointment->citizen_id)
            ->where('provider_id', (string) $provider->_id)
            ->whereIn('status', ['under-review', 'in-progress', 'awaiting-documents', 'accepted'])
            ->each(function ($petition) {
                $timeline = $petition->timeline ?? [];
                $timeline[] = [
                    'action'    => 'consultation-completed',
                    'note'      => 'Consultation session completed. Case remains active pending further legal work.',
                    'timestamp' => now()->toISOString(),
                ];
                $updates = ['timeline' => $timeline];
                // Nudge under-review → in-progress (work has actually begun), but don't resolve.
                if ($petition->status === 'under-review') {
                    $updates['status']    = 'in-progress';
                    $updates['next_step'] = 'Provider is actively working on your case following the consultation.';
                }
                $petition->update($updates);
            });

        return response()->json(['message' => 'Appointment marked as completed']);
    }

    // ── Transaction Actions ──────────────────────────────────────

    /**
     * DELETE /provider/transactions/{id}
     * Providers cannot delete escrow or cleared transactions — those represent real funds.
     * Only deletion of legacy/admin entries is permitted (status outside the escrow/cleared lifecycle).
     */
    public function deleteTransaction(Request $request, $id)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $transaction = Transaction::where('_id', $id)
            ->where('provider_id', (string) $provider->_id)
            ->first();

        if (!$transaction) return response()->json(['error' => 'Transaction not found'], 404);

        if (in_array($transaction->status, ['escrow', 'cleared'], true)) {
            return response()->json(['error' => 'Escrow and cleared transactions cannot be removed.'], 422);
        }

        $transaction->delete();

        return response()->json(['message' => 'Transaction removed successfully']);
    }

    // ── Helper ───────────────────────────────────────────────────

    private function resolveProvider(Request $request): ?Provider
    {
        $uid  = $request->firebase_uid;
        $user = User::where('firebase_uid', $uid)->first();
        if (!$user) return null;
        return Provider::where('user_id', (string) $user->_id)->first();
    }
}
