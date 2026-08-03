<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'nik' => 'required|string|max:20',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email',
            'address' => 'required|string',
            'occupation' => 'nullable|string|max:100',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            // Check-in data
            'property_id' => 'required|exists:properties,id',
            'room_id' => 'required|exists:rooms,id',
            'monthly_price' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'payment_day' => 'required|integer|between:1,28',
            'deposit_amount' => 'nullable|numeric|min:0',
            // Initial utility readings
            'initial_electricity_reading' => 'nullable|numeric|min:0',
            'initial_water_reading' => 'nullable|numeric|min:0',
        ];
    }
}
