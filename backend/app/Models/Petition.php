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
        'type',               // Legal matter type (Consultation, Document Drafting, Representation, etc.)
        'details',
        'urgency',            // normal | high | urgent
        'preferred_date',     // Citizen-suggested consultation date (optional)
        'preferred_time',     // Citizen-suggested consultation time (optional)
        'quoted_price',       // Numeric price for this case (taken from the chosen service)
        'status',             // pending | under-review | in-progress | awaiting-documents | resolved | closed | declined
        'next_step',
        'provider_notes',     // Provider's latest note visible to citizen
        'timeline',           // Array of {action, note, timestamp} for case history
    ];

    protected $casts = [
        'timeline' => 'array',
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
