<?php

namespace App\Models;

use App\Enums\RoomStatus;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use Auditable;
    use HasFactory;

    protected $fillable = [
        'property_id',
        'room_type_id',
        'number',
        'floor',
        'price',
        'discount_percent',
        'discount_amount',
        'status',
        'description',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'status' => RoomStatus::class,
            'is_active' => 'boolean',
        ];
    }

    public function getNetPriceAttribute(): float
    {
        $price = (float) $this->price;
        $afterPercent = $price * (1 - ((float) $this->discount_percent / 100));
        return max(0, round($afterPercent - (float) $this->discount_amount, 2));
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function utilityReadings(): HasMany
    {
        return $this->hasMany(UtilityReading::class);
    }

    public function cleaningTasks(): HasMany
    {
        return $this->hasMany(CleaningTask::class);
    }

    public function activeContract()
    {
        return $this->contracts()->where('status', 'active')->latest()->first();
    }

    public function isAvailable(): bool
    {
        return $this->status === RoomStatus::AVAILABLE;
    }

    public function isOccupied(): bool
    {
        return $this->status === RoomStatus::OCCUPIED;
    }
}
