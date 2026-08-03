<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'name' => $this->name,
            'description' => $this->description,
            'base_price' => $this->base_price,
            'capacity' => $this->capacity,
            'facilities' => $this->facilities,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'rooms_count' => $this->whenCounted('rooms'),
        ];
    }
}
