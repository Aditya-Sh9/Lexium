<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Eloquent\SoftDeletes;

class Provider extends Model
{
    use SoftDeletes;
    protected $connection = 'mongodb';
    protected $collection = 'providers';

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'service_type',           // advocate, notary, mediator, arbitrator, document-writer, tax-consultant
        'specialization',
        'bar_council_id',
        'location',
        'experience',             // years
        'bio',
        'price_range',
        'consultation_fee',
        'rating',
        'rating_count',
        'is_verified',
        'status',                 // 'pending', 'approved', 'rejected'
        'rejection_reason',

        // Onboarding fields
        'languages',              // array of strings
        'availability',           // string description
        'qualifications',         // array of strings
        'services',               // array of {name, price, duration}
        'badges',                 // array of strings
        'reviews',                // array of {id, author, rating, date, text}
        'review_count',

        // Document uploads (mock — stores metadata for future cloud migration)
        'verification_documents', // array of {name, original_name, size, uploaded_at}
        'government_id',          // {name, original_name, size, uploaded_at}
        'profile_photo',          // {name, original_name, size, uploaded_at}
    ];

    protected $casts = [
        'rating'                  => 'float',
        'rating_count'            => 'integer',
        'review_count'            => 'integer',
        'is_verified'             => 'boolean',
        'languages'               => 'array',
        'qualifications'          => 'array',
        'services'                => 'array',
        'badges'                  => 'array',
        'reviews'                 => 'array',
        'verification_documents'  => 'array',
        'government_id'           => 'array',
        'profile_photo'           => 'array',
    ];

    /**
     * The user account that owns this provider profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Appointments assigned to this provider.
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'provider_id');
    }

    /**
     * Petitions directed at this provider.
     */
    public function petitions()
    {
        return $this->hasMany(Petition::class, 'provider_id');
    }

    /**
     * Transactions for this provider.
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'provider_id');
    }

    /** Canonical service-type ids — the frontend filters on exactly these. */
    public const SERVICE_TYPES = ['advocate', 'mediator', 'arbitrator', 'notary', 'document-writer', 'tax-consultant'];

    /**
     * Store service_type as its canonical id, whatever form it arrives in
     * ("Advocate", "Document Writer", "notary public" → "advocate", ...).
     */
    public function setServiceTypeAttribute($value): void
    {
        $this->attributes['service_type'] = self::normalizeServiceType($value);
    }

    public static function normalizeServiceType($value): ?string
    {
        if ($value === null || $value === '') return $value;
        $slug = strtolower(trim(preg_replace('/[\s_]+/', '-', (string) $value)));
        return $slug === 'notary-public' ? 'notary' : $slug;
    }

    /**
     * Scope to only approved providers.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
