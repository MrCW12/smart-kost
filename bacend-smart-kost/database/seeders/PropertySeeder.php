<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\Owner;
use Illuminate\Database\Seeder;

class PropertySeeder extends Seeder
{
    public function run(): void
    {
        $owner = Owner::first();

        if (!$owner) return;

        Property::create([
            'owner_id' => $owner->id,
            'name' => 'Kost Melati',
            'address' => 'Jl. Melati No. 10, Jakarta Selatan',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'postal_code' => '12345',
            'phone' => '081234567891',
            'description' => 'Kost strategis dekat MRT',
            'is_active' => true,
        ]);

        Property::create([
            'owner_id' => $owner->id,
            'name' => 'Kost Mawar',
            'address' => 'Jl. Mawar No. 25, Jakarta Barat',
            'city' => 'Jakarta Barat',
            'province' => 'DKI Jakarta',
            'postal_code' => '12346',
            'phone' => '081234567892',
            'description' => 'Kost putri eksklusif',
            'is_active' => true,
        ]);
    }
}
