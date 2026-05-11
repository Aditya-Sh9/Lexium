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
        'type',              // Initial Consultation, Contract Review, etc.
        'date',
        'time',
        'status',            // pending, confirmed, completed, cancelled
        'notes',
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
