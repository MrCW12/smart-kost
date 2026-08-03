<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\RoomType;
use Illuminate\Database\Seeder;

class RoomTypeSeeder extends Seeder
{
    public function run(): void
    {
        $properties = Property::all();

        foreach ($properties as $property) {
            RoomType::create([
                'property_id' => $property->id,
                'name' => 'Standard',
                'description' => 'Kamar standar dengan fasilitas dasar',
                'base_price' => 1000000,
                'capacity' => 1,
                'facilities' => ['Kasur', 'Lemari', 'Meja'],
            ]);

            RoomType::create([
                'property_id' => $property->id,
                'name' => 'VIP',
                'description' => 'Kamar VIP dengan fasilitas lengkap',
                'base_price' => 1500000,
                'capacity' => 1,
                'facilities' => ['Kasur', 'Lemari', 'Meja', 'AC', 'WiFi', 'Kamar Mandi Dalam'],
            ]);

            RoomType::create([
                'property_id' => $property->id,
                'name' => 'Deluxe',
                'description' => 'Kamar deluxe premium',
                'base_price' => 2000000,
                'capacity' => 2,
                'facilities' => ['Kasur', 'Lemari', 'Meja', 'AC', 'WiFi', 'Kamar Mandi Dalam', 'TV', 'Water Heater'],
            ]);
        }
    }
}
