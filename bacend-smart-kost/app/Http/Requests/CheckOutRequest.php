<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'checkout_date' => 'required|date|after_or_equal:today',
            'notes' => 'nullable|string',
            'final_electricity_reading' => 'nullable|numeric|min:0',
            'final_water_reading' => 'nullable|numeric|min:0',
            'additional_charges' => 'nullable|array',
            'additional_charges.*.description' => 'required_with:additional_charges|string|max:255',
            'additional_charges.*.amount' => 'required_with:additional_charges|numeric|min:0',
        ];
    }
}
