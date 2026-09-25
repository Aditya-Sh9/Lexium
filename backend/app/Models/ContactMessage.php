<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class ContactMessage extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'contact_messages';

    protected $fillable = [
        'reference',      // Human-readable ID like MSG-7K4Q2M, quoted back to the sender
        'name',
        'email',
        'topic',
        'message',
        'ip',
        'user_agent',
        'mail_status',    // 'sent' | 'failed' — whether the notification email went out
        'mail_error',
    ];
}
