<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Property extends Model
{
    use Auditable;
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'slug',
        'address',
        'city',
        'province',
        'postal_code',
        'phone',
        'description',
        'latitude',
        'longitude',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Property $property) {
            if (empty($property->slug)) {
                $property->slug = Str::slug($property->name);
                $baseSlug = $property->slug;
                $count = 1;
                while (static::where('slug', $property->slug)->exists()) {
                    $property->slug = $baseSlug . '-' . $count;
                    $count++;
                }
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'property_user')->withTimestamps();
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function roomTypes(): HasMany
    {
        return $this->hasMany(RoomType::class);
    }

    public function totalRooms(): int
    {
        return $this->rooms()->count();
    }

    public function availableRooms(): int
    {
        return $this->rooms()->where('status', 'available')->count();
    }

    public function occupiedRooms(): int
    {
        return $this->rooms()->where('status', 'occupied')->count();
    }

    public function utilitySettings(): HasMany
    {
        return $this->hasMany(UtilitySetting::class);
    }
}
