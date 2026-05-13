<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProviderRejected extends Mailable
{
    use Queueable, SerializesModels;

    public string $providerName;
    public string $reason;

    public function __construct(string $providerName, string $reason)
    {
        $this->providerName = $providerName;
        $this->reason       = $reason;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Update on Your Lexium Application',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.provider-rejected',
            with: [
                'providerName' => $this->providerName,
                'reason'       => $this->reason,
            ],
        );
    }
}
