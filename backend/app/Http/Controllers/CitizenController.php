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
     * GET /citizen/dashboard — dashboard data for the authenticated citizen.
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

        return response()->json([
            'upcomingAppointments' => $upcomingAppointments,
            'savedProviders'      => $savedProviders,
            'recentMessages'      => [],
        ]);
    }

    /**
     * GET /citizen/petitions — petitions filed by the citizen.
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
            'provider_id' => 'required|string',
            'type'        => 'required|string',
            'details'     => 'nullable|string',
        ]);

        $provider = Provider::find($validated['provider_id']);

        $petition = Petition::create([
            'petition_id'   => 'PET-' . rand(1000, 9999),
            'citizen_id'    => (string) $user->_id,
            'citizen_name'  => $user->name,
            'provider_id'   => $validated['provider_id'],
            'provider_name' => $provider ? $provider->name : 'Unknown',
            'type'          => $validated['type'],
            'details'       => $validated['details'] ?? '',
            'status'        => 'pending',
            'next_step'     => 'Provider is reviewing your request.',
        ]);

        return response()->json(['message' => 'Petition created successfully', 'petition' => $petition], 201);
    }

    /**
     * DELETE /citizen/petitions/{id} — withdraw a petition.
     */
    public function withdrawPetition(Request $request, $id)
    {
        $user = $this->resolveUser($request);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        $petition = Petition::where('_id', $id)
            ->where('citizen_id', (string) $user->_id)
            ->first();

        if (!$petition) return response()->json(['error' => 'Petition not found'], 404);
        if ($petition->status === 'accepted') {
            return response()->json(['error' => 'Cannot withdraw an accepted petition. Please cancel the appointment instead.'], 422);
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
        ]);

        return response()->json(['message' => 'Appointment booked successfully', 'appointment' => $appointment], 201);
    }

    /**
     * PUT /citizen/appointments/{id}/reschedule — reschedule an appointment.
     */
    public function rescheduleAppointment(Request $request, $id)
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
            'status' => 'pending', // Reset to pending after reschedule
        ]);

        return response()->json(['message' => 'Appointment rescheduled', 'appointment' => $appointment->fresh()]);
    }

    /**
     * DELETE /citizen/appointments/{id} — cancel an appointment.
     */
    public function cancelAppointment(Request $request, $id)
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

    // ── Helper ───────────────────────────────────────────────────

    private function resolveUser(Request $request): ?User
    {
        return User::where('firebase_uid', $request->firebase_uid)->first();
    }
}
