<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Petition extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'petitions';

    protected $fillable = [
        'petition_id',        // Human-readable ID like PET-1029
        'citizen_id',
        'provider_id',
        'provider_name',
        'citizen_name',
        'type',               // Initial Consultation, Document Verification, etc.
        'details',
        'status',             // pending, accepted, declined, completed
        'next_step',
    ];

    public function citizen()
    {
        return $this->belongsTo(User::class, 'citizen_id');
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class, 'provider_id');
    }
}
