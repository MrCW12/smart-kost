<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'nik' => 'sometimes|string|max:20',
            'phone' => 'sometimes|string|max:20',
            'email' => 'nullable|email',
            'address' => 'sometimes|string',
            'occupation' => 'nullable|string|max:100',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'initial_electricity_reading' => 'nullable|numeric|min:0',
            'initial_water_reading' => 'nullable|numeric|min:0',
        ];
    }
}
