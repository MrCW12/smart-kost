<?php

namespace Database\Seeders;

use App\Models\Owner;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $developer = User::create([
            'name' => 'Developer',
            'email' => 'developer@smartkost.id',
            'password' => 'password',
            'phone' => '081234567890',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $developer->assignRole('developer');

        $ownerUser = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@smartkost.id',
            'password' => 'password',
            'phone' => '081234567891',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $ownerUser->assignRole('owner');

        Owner::create([
            'user_id' => $ownerUser->id,
            'company_name' => 'Budi Kost Management',
            'phone' => '081234567891',
            'address' => 'Jl. Sudirman No. 123, Jakarta',
            'status' => 'active',
        ]);

        $adminUser = User::create([
            'name' => 'Admin Kost',
            'email' => 'admin@smartkost.id',
            'password' => 'password',
            'phone' => '081234567892',
            'is_active' => true,
            'email_verified_at' => now(),
            'owner_id' => $ownerUser->owner->id,
        ]);
        $adminUser->assignRole('admin');

        $staffUser = User::create([
            'name' => 'Staff Kost',
            'email' => 'staff@smartkost.id',
            'password' => 'password',
            'phone' => '081234567893',
            'is_active' => true,
            'email_verified_at' => now(),
            'owner_id' => $ownerUser->owner->id,
        ]);
        $staffUser->assignRole('staff');
    }
}
