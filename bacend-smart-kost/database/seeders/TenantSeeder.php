<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        $property = Property::first();
        if (!$property) return;

        $room = $property->rooms()->where('status', 'available')->first();
        if (!$room) return;

        $tenant = Tenant::create([
            'name' => 'Siti Rahayu',
            'nik' => '3201234567890001',
            'phone' => '081234567801',
            'email' => 'siti@email.com',
            'address' => 'Jl. Merdeka No. 10, Bandung',
            'occupation' => 'Mahasiswa',
            'emergency_contact' => 'Bapak Siti',
            'emergency_phone' => '081234567802',
            'status' => 'active',
        ]);

        $room->update(['status' => 'occupied']);

        Contract::create([
            'tenant_id' => $tenant->id,
            'room_id' => $room->id,
            'property_id' => $property->id,
            'contract_number' => Contract::generateContractNumber(),
            'start_date' => now()->subMonth(),
            'monthly_price' => $room->price,
            'payment_day' => 1,
            'status' => 'active',
        ]);
    }
}
