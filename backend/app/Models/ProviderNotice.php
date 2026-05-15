<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/**
 * Generic, citizen-context-free compliance notices shown to providers.
 *
 * Notices NEVER reference complaint IDs, citizen names, or case codes
 * on the provider-facing API. The complaint_id below is admin-only
 * bookkeeping so that, if the moderation team later issues a deduction
 * for the same complaint, the redundant notice can be suppressed.
 *
 * Lifecycle (admin-controlled `status` field):
 *   - active        — issued, awaiting provider acknowledgement
 *   - acknowledged  — provider has acknowledged (still surfaced as history)
 *   - cleared       — admin marked the notice as resolved / cleared
 *   - archived      — soft-archived by admin (e.g. consolidating duplicates)
 *
 * Provider visibility: only `active` and `acknowledged` notices are returned
 * to the provider. `cleared` / `archived` are admin-only.
 */
class ProviderNotice extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'provider_notices';

    protected $fillable = [
        'provider_id',
        'complaint_id',       // admin-only — never returned to provider UI
        'type',               // warning | info | restriction
        'severity',           // low | medium | high
        'message',            // generic, citizen-context-free compliance copy
        'guidance_note',      // optional admin-authored improvement note (no complaint context)
        'status',             // active | acknowledged | cleared | archived
        'acknowledged',
        'acknowledged_at',
        'cleared_at',
        'cleared_by',         // human-readable admin label
    ];

    protected $casts = [
        'acknowledged' => 'boolean',
    ];

    public function scopeVisibleToProvider($query)
    {
        return $query->whereIn('status', ['active', 'acknowledged']);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Project a notice to the safe shape that providers may see.
     * Strips the bookkeeping complaint_id and exposes only the
     * compliance-oriented fields.
     */
    public function toProviderArray(): array
    {
        return [
            '_id'              => (string) $this->_id,
            'type'             => $this->type,
            'severity'         => $this->severity,
            'message'          => $this->message,
            'guidance_note'    => $this->guidance_note,
            'status'           => $this->status ?? 'active',
            'acknowledged'     => (bool) $this->acknowledged,
            'acknowledged_at'  => $this->acknowledged_at,
            'created_at'       => $this->created_at,
        ];
    }
}
