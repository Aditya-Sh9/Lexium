<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProviderApproved extends Mailable
{
    use Queueable, SerializesModels;

    public string $providerName;

    public function __construct(string $providerName)
    {
        $this->providerName = $providerName;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Lexium Application Has Been Approved',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.provider-approved',
            with: [
                'providerName' => $this->providerName,
            ],
        );
    }
}
