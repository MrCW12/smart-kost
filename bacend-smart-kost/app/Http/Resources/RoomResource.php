<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'room_type_id' => $this->room_type_id,
            'number' => $this->number,
            'floor' => $this->floor,
            'price' => $this->price,
            'discount_percent' => $this->discount_percent,
            'discount_amount' => $this->discount_amount,
            'net_price' => $this->net_price,
            'status' => $this->status,
            'status_label' => $this->status?->label() ?? 'Unknown',
            'status_color' => $this->status?->color() ?? 'gray',
            'description' => $this->description,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'property' => $this->whenLoaded('property', fn () => [
                'id' => $this->property->id,
                'name' => $this->property->name,
            ]),
            'room_type' => $this->whenLoaded('roomType', fn () => [
                'id' => $this->roomType->id,
                'name' => $this->roomType->name,
                'facilities' => $this->roomType->facilities,
            ]),
        ];
    }
}
