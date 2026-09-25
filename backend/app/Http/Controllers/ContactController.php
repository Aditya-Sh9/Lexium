<?php

namespace App\Http\Controllers;

use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class ContactController extends Controller
{
    private const TOPICS = [
        'A booking or case',
        'Fees or escrow',
        'A provider’s conduct',
        'Joining as a professional',
        'My account',
        'Something else',
    ];

    /**
     * POST /contact — public contact form.
     * The message is stored first, then emailed to the support inbox, so a
     * mail outage never loses a message.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:120',
            'email'   => 'required|email|max:190',
            'topic'   => ['required', 'string', Rule::in(self::TOPICS)],
            'message' => 'required|string|min:10|max:5000',
            // Honeypot: real users never see or fill this field.
            'website' => 'nullable|max:0',
        ]);

        $contact = ContactMessage::create([
            'reference'  => $this->publicId('MSG'),
            'name'       => trim($validated['name']),
            'email'      => trim($validated['email']),
            'topic'      => $validated['topic'],
            'message'    => trim($validated['message']),
            'ip'         => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ]);

        try {
            Mail::to(config('services.contact.to'))->send(new ContactMessageReceived($contact));
            $contact->update(['mail_status' => 'sent']);
        } catch (\Throwable $e) {
            Log::error("Contact email {$contact->reference} failed: " . $e->getMessage());
            $contact->update(['mail_status' => 'failed', 'mail_error' => substr($e->getMessage(), 0, 500)]);
        }

        return response()->json([
            'message'   => 'Thanks — your message has reached the Lexium team.',
            'reference' => $contact->reference,
        ], 201);
    }
}
