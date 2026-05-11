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
        'type',               // Consultation Fee, Contract Review, etc.
        'amount',
        'status',             // pending, cleared, refunded
        'date',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function provider()
    {
        return $this->belongsTo(Provider::class, 'provider_id');
    }
}
