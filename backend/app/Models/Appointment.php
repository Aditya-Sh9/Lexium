<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Appointment extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'appointments';

    protected $fillable = [
        'citizen_id',
        'provider_id',
        'provider_name',
        'citizen_name',
        'petition_id',       // Link back to the case this consultation belongs to (string MongoDB ObjectId)
        'petition_code',     // Human-readable petition code (e.g. PET-1029) for display
        'type',              // Initial Consultation, Follow-up, etc.
        'date',
        'time',
        'status',            // pending, confirmed, in-progress, completed, cancelled, declined
        'notes',
        'reviewed',          // boolean — citizen has submitted a review for this appointment
    ];

    protected $casts = [
        'reviewed' => 'boolean',
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
