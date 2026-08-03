<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\UtilitySetting;
use Illuminate\Database\Seeder;

class UtilitySettingSeeder extends Seeder
{
    public function run(): void
    {
        $properties = Property::all();

        foreach ($properties as $property) {
            UtilitySetting::create([
                'property_id' => $property->id,
                'type' => 'electricity',
                'name' => 'Listrik',
                'unit' => 'kWh',
                'rate' => 2000,
                'min_usage' => 0,
                'is_active' => true,
            ]);

            UtilitySetting::create([
                'property_id' => $property->id,
                'type' => 'water',
                'name' => 'Air',
                'unit' => 'm3',
                'rate' => 8000,
                'min_usage' => 0,
                'is_active' => true,
            ]);

            UtilitySetting::create([
                'property_id' => $property->id,
                'type' => 'internet',
                'name' => 'Internet',
                'unit' => 'bulan',
                'rate' => 100000,
                'min_usage' => 0,
                'is_active' => true,
            ]);
        }
    }
}
