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

        $activeClients = Appointment::where('provider_id', $pid)
            ->whereIn('status', ['confirmed', 'in-progress'])->count();

        $todayDocket = Appointment::where('provider_id', $pid)
            ->whereIn('status', ['pending', 'confirmed', 'in-progress'])
            ->orderBy('date', 'asc')->limit(5)->get();

        $pendingValue = Transaction::where('provider_id', $pid)->where('status', 'pending')->sum('amount');
        $clearedValue = Transaction::where('provider_id', $pid)->where('status', 'cleared')->sum('amount');
        $casesClosed  = Appointment::where('provider_id', $pid)->where('status', 'completed')->count();

        return response()->json([
            'standing'      => $provider->rating >= 4.5 ? 'Exemplary' : 'Good',
            'activeClients' => $activeClients,
            'weeklyApts'    => Appointment::where('provider_id', $pid)
                ->where('date', '>=', now()->startOfWeek()->toDateString())->count(),
            'badgesEarned'  => 0,
            'todayDocket'   => $todayDocket,
            'accruedValue'  => [
                'pending'      => $pendingValue,
                'cleared'      => $clearedValue,
                'monthlyTotal' => $pendingValue + $clearedValue,
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
        ]);
    }

    public function ledger(Request $request)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $pid = (string) $provider->_id;

        return response()->json([
            'clearedValue'  => Transaction::where('provider_id', $pid)->where('status', 'cleared')->sum('amount'),
            'pendingEscrow' => Transaction::where('provider_id', $pid)->where('status', 'pending')->sum('amount'),
            'transactions'  => Transaction::where('provider_id', $pid)->orderBy('created_at', 'desc')->limit(20)->get(),
        ]);
    }

    public function eminence(Request $request)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $pid = (string) $provider->_id;
        $casesClosed = Appointment::where('provider_id', $pid)->where('status', 'completed')->count();

        $tier = match (true) {
            $casesClosed >= 50 => 'Tier V',
            $casesClosed >= 30 => 'Tier IV',
            $casesClosed >= 15 => 'Tier III',
            $casesClosed >= 5  => 'Tier II',
            default            => 'Tier I',
        };

        return response()->json([
            'tier'             => $tier,
            'standing'         => $provider->rating >= 4.5 ? 'Exemplary' : 'Good',
            'casesClosed'      => $casesClosed,
            'proBonoCompleted' => 0,
            'ratingAvg'        => $provider->rating,
            'badges'           => [
                ['id' => 1, 'name' => 'Top Rated Advocate', 'icon' => 'star',   'earned' => $provider->rating >= 4.5],
                ['id' => 2, 'name' => 'Flawless Record',   'icon' => 'shield', 'earned' => $casesClosed >= 10],
                ['id' => 3, 'name' => 'Pro Bono Champion',  'icon' => 'award',  'earned' => false],
            ],
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

    public function acceptPetition(Request $request, $id)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $petition = Petition::where('_id', $id)->where('provider_id', (string) $provider->_id)->first();
        if (!$petition) return response()->json(['error' => 'Petition not found'], 404);

        $petition->update([
            'status'    => 'accepted',
            'next_step' => 'Awaiting scheduling confirmation.',
        ]);

        Appointment::create([
            'citizen_id'    => $petition->citizen_id,
            'citizen_name'  => $petition->citizen_name,
            'provider_id'   => $petition->provider_id,
            'provider_name' => $petition->provider_name,
            'type'          => $petition->type,
            'date'          => now()->addDays(3)->toDateString(),
            'time'          => '10:00 AM',
            'status'        => 'confirmed',
        ]);

        return response()->json(['message' => "Petition accepted"]);
    }

    public function declinePetition(Request $request, $id)
    {
        $provider = $this->resolveProvider($request);
        if (!$provider) return response()->json(['error' => 'Provider profile not found'], 404);

        $petition = Petition::where('_id', $id)->where('provider_id', (string) $provider->_id)->first();
        if (!$petition) return response()->json(['error' => 'Petition not found'], 404);

        $petition->update([
            'status'    => 'declined',
            'next_step' => 'The provider has declined this request.',
        ]);

        return response()->json(['message' => "Petition declined"]);
    }

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
     * PUT /provider/appointments/{id}/complete — mark an appointment as completed.
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

        // Auto-create a cleared transaction
        Transaction::create([
            'transaction_id' => 'TRX-' . rand(1000, 9999),
            'provider_id'    => (string) $provider->_id,
            'client_name'    => $appointment->citizen_name,
            'type'           => $appointment->type,
            'amount'         => 2500,
            'status'         => 'cleared',
            'date'           => now()->toDateString(),
        ]);

        return response()->json(['message' => 'Appointment marked as completed']);
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
