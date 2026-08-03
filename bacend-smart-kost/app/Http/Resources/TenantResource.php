<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'nik' => $this->nik,
            'ktp_photo' => $this->ktp_photo,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'occupation' => $this->occupation,
            'emergency_contact' => $this->emergency_contact,
            'emergency_phone' => $this->emergency_phone,
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'status_color' => $this->status->color(),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'active_contract' => $this->whenLoaded('activeContract', fn () => [
                'id' => $this->activeContract->id,
                'contract_number' => $this->activeContract->contract_number,
                'room_id' => $this->activeContract->room_id,
                'room_number' => $this->activeContract->room?->number,
                'room_floor' => $this->activeContract->room?->floor,
                'room_type' => $this->activeContract->room?->roomType?->name,
                'property_id' => $this->activeContract->property_id,
                'property_name' => $this->activeContract->property?->name,
                'monthly_price' => $this->activeContract->monthly_price,
                'deposit_amount' => $this->activeContract->deposit_amount,
                'start_date' => $this->activeContract->start_date->format('Y-m-d'),
                'end_date' => $this->activeContract->end_date?->format('Y-m-d'),
            ]),
            'contracts' => $this->whenLoaded('contracts'),
        ];
    }
}
