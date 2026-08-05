<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UtilityReading extends Model
{
    use Auditable;

    protected $fillable = [
        'room_id',
        'property_id',
        'utility_setting_id',
        'contract_id',
        'period_month',
        'period_year',
        'reading_start',
        'reading_end',
        'usage_amount',
        'amount',
        'input_by',
        'input_at',
    ];

    protected function casts(): array
    {
        return [
            'reading_start' => 'decimal:2',
            'reading_end' => 'decimal:2',
            'usage_amount' => 'decimal:2',
            'amount' => 'decimal:2',
            'input_at' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function utilitySetting(): BelongsTo
    {
        return $this->belongsTo(UtilitySetting::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function inputByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'input_by');
    }

    public function calculateUsage(): void
    {
        if ($this->reading_end !== null && $this->reading_start !== null) {
            $this->usage_amount = $this->reading_end - $this->reading_start;
            $this->amount = $this->usage_amount * $this->utilitySetting->rate;
        }
    }
}
