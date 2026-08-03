<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomType extends Model
{
    protected $fillable = [
        'property_id',
        'name',
        'description',
        'base_price',
        'capacity',
        'facilities',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'capacity' => 'integer',
            'facilities' => 'array',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
