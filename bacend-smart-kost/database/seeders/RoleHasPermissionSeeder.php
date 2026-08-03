<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleHasPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $allPermissions = Permission::pluck('name')->toArray();

        $developerPermissions = $allPermissions;

        $ownerPermissions = array_filter($allPermissions, function ($p) {
            return !str_starts_with($p, 'user.') &&
                   !str_starts_with($p, 'role.') &&
                   !str_starts_with($p, 'owner.switch') &&
                   !str_starts_with($p, 'system.');
        });

        $adminPermissions = array_filter($allPermissions, function ($p) {
            return !str_starts_with($p, 'user.') &&
                   !str_starts_with($p, 'role.') &&
                   !str_starts_with($p, 'owner.') &&
                   !str_starts_with($p, 'system.') &&
                   !in_array($p, ['report.finance', 'property.create', 'property.update', 'property.delete',
                                   'room-type.create', 'room-type.update', 'room-type.delete']);
        });

        $staffPermissions = array_filter($allPermissions, function ($p) {
            return in_array($p, [
                'utility.input-reading',
                'cleaning.view',
                'cleaning.update',
            ]);
        });

        $developer = Role::where('name', 'developer')->first();
        $developer->syncPermissions($developerPermissions);

        $owner = Role::where('name', 'owner')->first();
        $owner->syncPermissions($ownerPermissions);

        $admin = Role::where('name', 'admin')->first();
        $admin->syncPermissions($adminPermissions);

        $staff = Role::where('name', 'staff')->first();
        $staff->syncPermissions($staffPermissions);
    }
}
