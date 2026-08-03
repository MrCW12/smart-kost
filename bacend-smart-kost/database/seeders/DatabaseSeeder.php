<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            RoleHasPermissionSeeder::class,
            UserSeeder::class,
            PropertySeeder::class,
            RoomTypeSeeder::class,
            RoomSeeder::class,
            TenantSeeder::class,
            UtilitySettingSeeder::class,
            ExpenseCategorySeeder::class,
            DummyDataSeeder::class,
        ]);
    }
}
