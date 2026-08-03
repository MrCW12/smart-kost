<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UtilitySetting extends Model
{
    protected $fillable = [
        'property_id',
        'type',
        'name',
        'unit',
        'rate',
        'min_usage',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'min_usage' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function readings(): HasMany
    {
        return $this->hasMany(UtilityReading::class);
    }
}
