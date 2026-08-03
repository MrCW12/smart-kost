<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contract_id' => 'required|exists:contracts,id',
            'period_month' => 'required|integer|between:1,12',
            'period_year' => 'required|integer',
            'utility_readings' => 'nullable|array',
            'utility_readings.*.utility_setting_id' => 'required_with:utility_readings|exists:utility_settings,id',
            'utility_readings.*.reading_start' => 'required_with:utility_readings|numeric|min:0',
            'utility_readings.*.reading_end' => 'required_with:utility_readings|numeric|min:0|gte:utility_readings.*.reading_start',
            'additional_charges' => 'nullable|array',
            'additional_charges.*.description' => 'required_with:additional_charges|string|max:255',
            'additional_charges.*.amount' => 'required_with:additional_charges|numeric|min:0',
        ];
    }
}
