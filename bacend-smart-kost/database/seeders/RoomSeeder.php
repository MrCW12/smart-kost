<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $properties = Property::all();

        foreach ($properties as $property) {
            $standardType = $property->roomTypes()->where('name', 'Standard')->first();
            $vipType = $property->roomTypes()->where('name', 'VIP')->first();

            // Create rooms A01-A05
            for ($i = 1; $i <= 5; $i++) {
                $number = 'A' . str_pad($i, 2, '0', STR_PAD_LEFT);
                Room::create([
                    'property_id' => $property->id,
                    'room_type_id' => $standardType?->id,
                    'number' => $number,
                    'floor' => '1',
                    'price' => $standardType?->base_price ?? 1000000,
                    'status' => 'available',
                    'is_active' => true,
                ]);
            }

            // Create rooms B01-B03
            for ($i = 1; $i <= 3; $i++) {
                $number = 'B' . str_pad($i, 2, '0', STR_PAD_LEFT);
                Room::create([
                    'property_id' => $property->id,
                    'room_type_id' => $vipType?->id,
                    'number' => $number,
                    'floor' => '2',
                    'price' => $vipType?->base_price ?? 1500000,
                    'status' => 'available',
                    'is_active' => true,
                ]);
            }
        }
    }
}
