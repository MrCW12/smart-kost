<?php

namespace App\Http\Requests;

use App\Enums\RoomStatus;
use Illuminate\Foundation\Http\FormRequest;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $statuses = implode(',', array_column(RoomStatus::cases(), 'value'));

        return [
            'room_type_id' => 'nullable|exists:room_types,id',
            'number' => 'required|string|max:20',
            'floor' => 'nullable|string|max:10',
            'price' => 'required|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'status' => "nullable|string|in:{$statuses}",
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
        ];
    }
}
