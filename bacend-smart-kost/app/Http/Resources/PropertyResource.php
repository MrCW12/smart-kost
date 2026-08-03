<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'owner_id' => $this->owner_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'address' => $this->address,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postal_code,
            'phone' => $this->phone,
            'description' => $this->description,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'total_rooms' => $this->when($this->relationLoaded('rooms'), fn () => $this->rooms->count()),
            'available_rooms' => $this->when($this->relationLoaded('rooms'), fn () => $this->rooms->where('status', 'available')->count()),
            'occupied_rooms' => $this->when($this->relationLoaded('rooms'), fn () => $this->rooms->where('status', 'occupied')->count()),
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'user_id' => $this->owner->user_id,
                'company_name' => $this->owner->company_name,
            ]),
            'room_types' => $this->whenLoaded('room_types'),
        ];
    }
}
