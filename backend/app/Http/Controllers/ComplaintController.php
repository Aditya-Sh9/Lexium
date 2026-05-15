<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Petition;
use App\Models\Appointment;
use App\Models\Transaction;
use App\Models\Complaint;

class ComplaintController extends Controller
{
    /**
     * GET /citizen/complaints
     * Returns complaints filed by the current citizen. Admin-only fields
     * (admin_notes, raw action notes) are stripped — the response carries
     * a citizen-safe `public_actions` timeline derived from the moderation log.
     */
    public function index(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $complaints = Complaint::where('citizen_id', (string) $user->_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($c) => $this->projectForCitizen($c))
            ->values();

        return response()->json($complaints);
    }

    /**
     * Translate the admin moderation log into citizen-safe action summaries.
     * Internal admin reasons are never returned; only generic labels.
     */
    private function projectForCitizen(Complaint $c): array
    {
        // Derive an enriched, citizen-facing status:
        // - 'escrow-on-hold' when an active escrow hold action exists and the complaint is still under-review
        // - 'action-taken'    when admin issued a warning or adjustment but did not yet resolve
        // - otherwise echo the underlying status
        $rawActions  = is_array($c->actions_log) ? $c->actions_log : [];
        $hasHold     = collect($rawActions)->contains(fn ($a) => ($a['action'] ?? null) === 'escrow-held');
        $hasWarning  = collect($rawActions)->contains(fn ($a) => ($a['action'] ?? null) === 'provider-warned');
        $hasDeduct   = collect($rawActions)->contains(fn ($a) => ($a['action'] ?? null) === 'earnings-deducted');

        $publicStatus = $c->status;
        if ($c->status === 'under-review' && $hasHold) {
            $publicStatus = 'escrow-on-hold';
        } elseif (in_array($c->status, ['open', 'under-review'], true) && ($hasWarning || $hasDeduct)) {
            $publicStatus = 'action-taken';
        }

        // Map admin action codes to citizen-safe copy.
        $publicActions = collect($rawActions)->map(function ($a) {
            $code = $a['action'] ?? '';
            $when = $a['timestamp'] ?? null;
            $map = [
                'filed'                => ['Complaint submitted',                       'Your concern has been forwarded to Lexium Compliance.'],
                'status-under-review'  => ['Issue reviewed by compliance team',         'The compliance team is now reviewing this complaint.'],
                'escrow-held'          => ['Escrow temporarily placed on hold',         'Funds linked to this case are protected during the review.'],
                'provider-warned'      => ['Administrative warning issued',             'Lexium has issued a compliance warning to the provider.'],
                'earnings-deducted'    => ['Provider earnings adjusted',                'A marketplace adjustment has been applied to the provider\'s account.'],
                'escrow-released'      => ['Escrow funds released after review',        'The held funds have been released following the compliance review.'],
                'status-resolved'      => ['Complaint resolved after review',           'Your complaint has been resolved by Lexium Compliance.'],
                'status-dismissed'     => ['Complaint reviewed and closed',             'After review, Lexium Compliance has closed this complaint.'],
            ];
            if (!isset($map[$code])) return null;
            return [
                'code'      => $code,
                'label'     => $map[$code][0],
                'note'      => $map[$code][1],
                'timestamp' => $when,
            ];
        })->filter()->values();

        return [
            '_id'              => (string) $c->_id,
            'complaint_id'     => $c->complaint_id,
            'provider_id'      => $c->provider_id,
            'provider_name'    => $c->provider_name,
            'petition_id'      => $c->petition_id,
            'petition_code'    => $c->petition_code,
            'appointment_id'   => $c->appointment_id,
            'transaction_id'   => $c->transaction_id,
            'issue_type'       => $c->issue_type,
            'severity'         => $c->severity,
            'description'      => $c->description,
            'evidence'         => is_array($c->evidence) ? $c->evidence : [],
            'status'           => $c->status,
            'public_status'    => $publicStatus,
            'escrow_on_hold'   => $hasHold && in_array($c->status, ['open', 'under-review'], true),
            'public_actions'   => $publicActions,
            'created_at'       => $c->created_at,
            'updated_at'       => $c->updated_at,
            'resolved_at'      => $c->resolved_at,
        ];
    }

    /**
     * POST /citizen/complaints
     * File a new complaint linked to a petition / appointment / transaction.
     */
    public function store(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $validated = $request->validate([
            'petition_id'    => 'nullable|string',
            'appointment_id' => 'nullable|string',
            'transaction_id' => 'nullable|string',
            'issue_type'     => 'required|in:payment,misconduct,premature-closure,unsatisfactory,fraud,other',
            'severity'       => 'required|in:low,medium,high',
            'description'    => 'required|string|min:20|max:2000',
            'evidence'       => 'nullable|array',
        ]);

        // Must be tied to at least a petition OR an appointment.
        if (empty($validated['petition_id']) && empty($validated['appointment_id'])) {
            return response()->json(['error' => 'Complaint must reference a petition or appointment.'], 422);
        }

        // Resolve linked records and pull provider info from the most reliable source.
        $petition    = !empty($validated['petition_id']) ? Petition::find($validated['petition_id']) : null;
        $appointment = !empty($validated['appointment_id']) ? Appointment::find($validated['appointment_id']) : null;

        // If no petition was passed but the appointment has one, follow the link.
        if (!$petition && $appointment && !empty($appointment->petition_id)) {
            $petition = Petition::find($appointment->petition_id);
        }

        // Ownership guard — the citizen must actually own the linked records.
        if ($petition && (string) $petition->citizen_id !== (string) $user->_id) {
            return response()->json(['error' => 'You can only file complaints for your own cases.'], 403);
        }
        if ($appointment && (string) $appointment->citizen_id !== (string) $user->_id) {
            return response()->json(['error' => 'You can only file complaints for your own appointments.'], 403);
        }

        $providerId   = $petition->provider_id ?? $appointment->provider_id ?? null;
        $providerName = $petition->provider_name ?? $appointment->provider_name ?? null;

        if (!$providerId) {
            return response()->json(['error' => 'Could not resolve a provider for this complaint.'], 422);
        }

        // Resolve transaction either from explicit ID or via the petition link.
        $transaction = null;
        if (!empty($validated['transaction_id'])) {
            $transaction = Transaction::find($validated['transaction_id']);
        } elseif ($petition) {
            $transaction = Transaction::where('petition_id', (string) $petition->_id)
                ->orderBy('created_at', 'desc')
                ->first();
        }

        // Duplicate guard — disallow more than one active complaint per case+citizen.
        $duplicateQuery = Complaint::where('citizen_id', (string) $user->_id)
            ->whereIn('status', ['open', 'under-review']);

        if ($petition) {
            $duplicateQuery->where('petition_id', (string) $petition->_id);
        } elseif ($appointment) {
            $duplicateQuery->where('appointment_id', (string) $appointment->_id);
        }

        if ($duplicateQuery->exists()) {
            return response()->json([
                'error' => 'You already have an active complaint on this case. Please wait for admin review.',
            ], 409);
        }

        $complaint = Complaint::create([
            'complaint_id'     => 'CMP-' . rand(1000, 9999),
            'citizen_id'       => (string) $user->_id,
            'citizen_name'     => $user->name,
            'provider_id'      => (string) $providerId,
            'provider_name'    => $providerName,
            'petition_id'      => $petition ? (string) $petition->_id : null,
            'petition_code'    => $petition->petition_id ?? null,
            'appointment_id'   => $appointment ? (string) $appointment->_id : null,
            'transaction_id'   => $transaction ? (string) $transaction->_id : null,
            'transaction_code' => $transaction->transaction_id ?? null,
            'issue_type'       => $validated['issue_type'],
            'severity'         => $validated['severity'],
            'description'      => $validated['description'],
            'evidence'         => $validated['evidence'] ?? [],
            'status'           => 'open',
            'admin_notes'      => [],
            'actions_log'      => [[
                'action'    => 'filed',
                'note'      => 'Complaint submitted by citizen.',
                'timestamp' => now()->toISOString(),
            ]],
        ]);

        return response()->json([
            'message'   => 'Complaint filed. Our admin team will review it shortly.',
            'complaint' => $complaint,
        ], 201);
    }

    private function resolveUser(Request $request): ?User
    {
        return User::where('firebase_uid', $request->firebase_uid)->first();
    }
}
