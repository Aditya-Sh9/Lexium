<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Complaint extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'complaints';

    protected $fillable = [
        'complaint_id',       // Human-readable ID like CMP-1234
        'citizen_id',
        'citizen_name',
        'provider_id',
        'provider_name',
        'petition_id',        // Linked case (string ObjectId)
        'petition_code',      // Human-readable case code (PET-XXXX)
        'appointment_id',
        'transaction_id',     // Linked transaction (string ObjectId)
        'transaction_code',
        'issue_type',         // payment | misconduct | premature-closure | unsatisfactory | fraud | other
        'severity',           // low | medium | high
        'description',
        'evidence',           // Optional metadata { name, original_name, size, uploaded_at }
        'status',             // open | under-review | resolved | dismissed
        'admin_notes',        // Array of { note, timestamp }
        'actions_log',        // Array of { action, note, timestamp } — warnings, deductions, holds
        'resolved_at',
    ];

    protected $casts = [
        'admin_notes' => 'array',
        'actions_log' => 'array',
        'evidence'    => 'array',
    ];

    public function citizen()
    {
        return $this->belongsTo(User::class, 'citizen_id');
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class, 'provider_id');
    }

    public function petition()
    {
        return $this->belongsTo(Petition::class, 'petition_id');
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }

    public function scopeBlocking($query)
    {
        return $query->whereIn('status', ['open', 'under-review']);
    }
}
