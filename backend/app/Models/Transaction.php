<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Transaction extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'transactions';

    protected $fillable = [
        'transaction_id',     // Human-readable ID like TRX-9821
        'provider_id',
        'client_name',
        'petition_id',        // Linked case (string ObjectId) — used by admin escrow release
        'petition_code',      // Human-readable case code (PET-XXXX)
        'appointment_id',     // Linked consultation that generated this transaction
        'type',               // Consultation Fee, Contract Review, etc.
        'amount',
        'status',             // escrow | cleared
        'date',
        'released_at',        // Timestamp when admin released escrow to cleared
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function provider()
    {
        return $this->belongsTo(Provider::class, 'provider_id');
    }
}
