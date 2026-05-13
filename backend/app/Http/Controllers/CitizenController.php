<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Provider;
use App\Models\Appointment;
use App\Models\Petition;

class CitizenController extends Controller
{
    /**
     * GET /citizen/dashboard
     */
    public function dashboard(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $upcomingAppointments = Appointment::where('citizen_id', (string) $user->_id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('date', 'asc')
            ->limit(5)
            ->get();

        $savedProviders = Provider::where('is_verified', true)
            ->orderBy('rating', 'desc')
            ->limit(5)
            ->get(['_id', 'name', 'specialization', 'rating', 'location']);

        $activeCases = Petition::where('citizen_id', (string) $user->_id)
            ->whereIn('status', ['pending', 'under-review', 'in-progress', 'awaiting-documents', 'accepted'])
            ->count();

        $pendingReviews = Appointment::where('citizen_id', (string) $user->_id)
            ->where('status', 'completed')
            ->where(function ($q) {
                $q->where('reviewed', false)->orWhereNull('reviewed');
            })
            ->count();

        $resolvedCases = Petition::where('citizen_id', (string) $user->_id)
            ->whereIn('status', ['resolved', 'closed'])
            ->count();

        // Recent active cases — gives the citizen a visible feedback loop after filing.
        $recentCases = Petition::where('citizen_id', (string) $user->_id)
            ->whereIn('status', ['pending', 'under-review', 'in-progress', 'awaiting-documents', 'accepted'])
            ->orderBy('updated_at', 'desc')
            ->limit(3)
            ->get(['_id', 'petition_id', 'provider_name', 'type', 'status', 'next_step', 'updated_at', 'created_at']);

        return response()->json([
            'upcomingAppointments' => $upcomingAppointments,
            'savedProviders'       => $savedProviders,
            'recentCases'          => $recentCases,
            'recentMessages'       => [],
            'summary' => [
                'activeCases'    => $activeCases,
                'pendingReviews' => $pendingReviews,
                'resolvedCases'  => $resolvedCases,
                'upcomingCount'  => $upcomingAppointments->count(),
            ],
        ]);
    }

    /**
     * GET /citizen/petitions — all petitions filed by the citizen.
     */
    public function petitions(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $petitions = Petition::where('citizen_id', (string) $user->_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($petitions);
    }

    /**
     * POST /citizen/petitions — create a new petition / service request.
     */
    public function createPetition(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $validated = $request->validate([
            'provider_id'    => 'required|string',
            'type'           => 'required|string',
            'details'        => 'required|string|min:10',
            'urgency'        => 'nullable|in:normal,high,urgent',
            'preferred_date' => 'nullable|string',
            'preferred_time' => 'nullable|string',
            'quoted_price'   => 'nullable|numeric|min:0',
        ]);

        $provider = Provider::find($validated['provider_id']);
        if (!$provider) return response()->json(['error' => 'Provider not found'], 404);

        // Resolve quoted price: explicit > matched service > default consultation fee
        $quotedPrice = isset($validated['quoted_price']) ? (float) $validated['quoted_price'] : null;
        if ($quotedPrice === null) {
            foreach (($provider->services ?? []) as $svc) {
                if (($svc['name'] ?? null) === $validated['type']) {
                    $quotedPrice = (float) preg_replace('/[^\d.]/', '', (string) ($svc['price'] ?? '')) ?: null;
                    break;
                }
            }
        }
        if ($quotedPrice === null) {
            $quotedPrice = (float) ($provider->consultation_fee ?: 0);
        }

        $urgency = $validated['urgency'] ?? 'normal';
        $urgencyNote = match ($urgency) {
            'urgent' => ' (URGENT — citizen requests immediate review)',
            'high'   => ' (High priority — within 48 hours)',
            default  => '',
        };

        $submittedNote = 'Case filed and awaiting provider review.' . $urgencyNote;
        if (!empty($validated['preferred_date']) || !empty($validated['preferred_time'])) {
            $submittedNote .= ' Preferred consultation: ' .
                ($validated['preferred_date'] ?? 'any date') . ' at ' .
                ($validated['preferred_time'] ?? 'any time') . '.';
        }

        $petition = Petition::create([
            'petition_id'    => 'PET-' . rand(1000, 9999),
            'citizen_id'     => (string) $user->_id,
            'citizen_name'   => $user->name,
            'provider_id'    => $validated['provider_id'],
            'provider_name'  => $provider->name,
            'type'           => $validated['type'],
            'details'        => $validated['details'],
            'urgency'        => $urgency,
            'preferred_date' => $validated['preferred_date'] ?? null,
            'preferred_time' => $validated['preferred_time'] ?? null,
            'quoted_price'   => $quotedPrice,
            'status'         => 'pending',
            'next_step'      => 'Provider is reviewing your case. You will be notified when accepted.',
            'timeline'       => [[
                'action'    => 'submitted',
                'note'      => $submittedNote,
                'timestamp' => now()->toISOString(),
            ]],
        ]);

        return response()->json(['message' => 'Case filed successfully', 'petition' => $petition], 201);
    }

    /**
     * DELETE /citizen/petitions/{id} — withdraw a pending petition.
     */
    public function withdrawPetition(Request $request, string $id)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $petition = Petition::where('_id', $id)
            ->where('citizen_id', (string) $user->_id)
            ->first();

        if (!$petition) return response()->json(['error' => 'Petition not found'], 404);

        if (!in_array($petition->status, ['pending'])) {
            return response()->json(['error' => 'Only pending petitions can be withdrawn.'], 422);
        }

        $petition->delete();
        return response()->json(['message' => 'Petition withdrawn successfully']);
    }

    /**
     * POST /citizen/appointments — create a new appointment (booking flow).
     */
    public function createAppointment(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $validated = $request->validate([
            'provider_id'      => 'required|string',
            'date'             => 'required|string',
            'time'             => 'required|string',
            'type'             => 'required|string',
            'case_description' => 'nullable|string',
        ]);

        $provider = Provider::find($validated['provider_id']);
        if (!$provider) return response()->json(['error' => 'Provider not found'], 404);

        $appointment = Appointment::create([
            'citizen_id'    => (string) $user->_id,
            'citizen_name'  => $user->name,
            'provider_id'   => $validated['provider_id'],
            'provider_name' => $provider->name,
            'type'          => $validated['type'],
            'date'          => $validated['date'],
            'time'          => $validated['time'],
            'status'        => 'pending',
            'notes'         => $validated['case_description'] ?? '',
            'reviewed'      => false,
        ]);

        return response()->json(['message' => 'Appointment booked successfully', 'appointment' => $appointment], 201);
    }

    /**
     * PUT /citizen/appointments/{id}/reschedule
     */
    public function rescheduleAppointment(Request $request, string $id)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $validated = $request->validate([
            'date' => 'required|string',
            'time' => 'required|string',
        ]);

        $appointment = Appointment::where('_id', $id)
            ->where('citizen_id', (string) $user->_id)
            ->first();

        if (!$appointment) return response()->json(['error' => 'Appointment not found'], 404);
        if ($appointment->status === 'completed') {
            return response()->json(['error' => 'Cannot reschedule a completed appointment'], 422);
        }

        $appointment->update([
            'date'   => $validated['date'],
            'time'   => $validated['time'],
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Appointment rescheduled', 'appointment' => $appointment->fresh()]);
    }

    /**
     * DELETE /citizen/appointments/{id} — cancel an appointment.
     */
    public function cancelAppointment(Request $request, string $id)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $appointment = Appointment::where('_id', $id)
            ->where('citizen_id', (string) $user->_id)
            ->first();

        if (!$appointment) return response()->json(['error' => 'Appointment not found'], 404);
        if ($appointment->status === 'completed') {
            return response()->json(['error' => 'Cannot cancel a completed appointment'], 422);
        }

        $appointment->update(['status' => 'cancelled']);
        return response()->json(['message' => 'Appointment cancelled']);
    }

    /**
     * GET /citizen/history — completed/cancelled appointment history.
     */
    public function history(Request $request)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $history = Appointment::where('citizen_id', (string) $user->_id)
            ->whereIn('status', ['completed', 'cancelled'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($history);
    }

    /**
     * POST /citizen/appointments/{id}/review
     * Submit a rating and review for a completed appointment.
     */
    public function submitReview(Request $request, string $id)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $appointment = Appointment::where('_id', $id)
            ->where('citizen_id', (string) $user->_id)
            ->first();

        if (!$appointment) return response()->json(['error' => 'Appointment not found'], 404);
        if ($appointment->status !== 'completed') {
            return response()->json(['error' => 'Reviews can only be submitted for completed appointments.'], 422);
        }
        if ($appointment->reviewed) {
            return response()->json(['error' => 'You have already reviewed this appointment.'], 422);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:1000',
        ]);

        $provider = Provider::find($appointment->provider_id);
        if (!$provider) return response()->json(['error' => 'Provider not found'], 404);

        // Build the review entry
        $newReview = [
            'id'     => 'REV-' . rand(10000, 99999),
            'author' => $user->name,
            'rating' => (int) $validated['rating'],
            'date'   => now()->toDateString(),
            'text'   => $validated['review'] ?? '',
        ];

        // Append to provider's reviews array
        $reviews = is_array($provider->reviews) ? $provider->reviews : [];
        $reviews[] = $newReview;

        // Recalculate average rating
        $totalRating   = array_sum(array_column($reviews, 'rating'));
        $newAvgRating  = round($totalRating / count($reviews), 2);
        $newCount      = count($reviews);

        $provider->update([
            'reviews'      => $reviews,
            'rating'       => $newAvgRating,
            'review_count' => $newCount,
            'rating_count' => $newCount,
        ]);

        // Mark appointment as reviewed to prevent duplicates
        $appointment->update(['reviewed' => true]);

        return response()->json([
            'message' => 'Review submitted successfully',
            'new_rating' => $newAvgRating,
        ]);
    }

    // ── Helper ───────────────────────────────────────────────────

    private function resolveUser(Request $request): ?User
    {
        return User::where('firebase_uid', $request->firebase_uid)->first();
    }
}
