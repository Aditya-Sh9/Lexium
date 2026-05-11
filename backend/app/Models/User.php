<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class User extends Model
{
    use Notifiable, SoftDeletes;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable = [
        'firebase_uid',
        'name',
        'email',
        'role',              // 'citizen', 'provider', or 'admin'
        'phone',
        'avatar_url',
        'status',            // 'active' (citizen/admin), 'pending', 'approved', 'rejected' (provider)
        'password_hash',     // Only used for admin (bypasses Firebase)
        'rejection_reason',
        'admin_token',       // Session token for admin auth
    ];

    protected $hidden = [
        'password_hash',
        'admin_token',
        'remember_token',
    ];

    /**
     * Get the provider profile associated with this user (if role=provider).
     */
    public function providerProfile()
    {
        return $this->hasOne(Provider::class, 'user_id');
    }

    /**
     * Get appointments where this user is the citizen.
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'citizen_id');
    }

    /**
     * Get petitions filed by this citizen.
     */
    public function petitions()
    {
        return $this->hasMany(Petition::class, 'citizen_id');
    }

    /**
     * Check if this user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if this provider is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved' || $this->status === 'active';
    }
}
