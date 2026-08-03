<?php

namespace App\Models;

use App\Enums\ContractStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'room_id',
        'property_id',
        'contract_number',
        'start_date',
        'end_date',
        'monthly_price',
        'deposit_amount',
        'payment_day',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'monthly_price' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'status' => ContractStatus::class,
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function isActive(): bool
    {
        return $this->status === ContractStatus::ACTIVE;
    }

    public static function generateContractNumber(): string
    {
        $prefix = 'CTR-' . now()->format('Ym');
        $lastContract = static::where('contract_number', 'like', $prefix . '%')
            ->orderByDesc('contract_number')
            ->first();

        if ($lastContract) {
            $lastNumber = (int) substr($lastContract->contract_number, -3);
            $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '001';
        }

        return $prefix . '-' . $newNumber;
    }
}
