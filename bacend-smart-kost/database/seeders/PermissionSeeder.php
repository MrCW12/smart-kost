<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // User Management
            'user.view',
            'user.create',
            'user.update',
            'user.delete',

            // Role Management
            'role.view',
            'role.create',
            'role.update',
            'role.delete',

            // Owner Management
            'owner.view',
            'owner.create',
            'owner.update',
            'owner.delete',
            'owner.switch',

            // Property/Location
            'property.view',
            'property.create',
            'property.update',
            'property.delete',

            // Room Type
            'room-type.view',
            'room-type.create',
            'room-type.update',
            'room-type.delete',

            // Room
            'room.view',
            'room.create',
            'room.update',
            'room.delete',
            'room.update-status',

            // Tenant
            'tenant.view',
            'tenant.create',
            'tenant.update',
            'tenant.delete',
            'tenant.upload-ktp',
            'tenant.check-in',
            'tenant.check-out',

            // Contract
            'contract.view',
            'contract.create',
            'contract.update',
            'contract.terminate',

            // Utility
            'utility.view',
            'utility.setting',
            'utility.input-reading',

            // Invoice
            'invoice.view',
            'invoice.generate',
            'invoice.update',
            'invoice.cancel',

            // Payment
            'payment.view',
            'payment.create',
            'payment.confirm',
            'payment.reject',

            // Expense
            'expense.view',
            'expense.create',
            'expense.update',
            'expense.delete',

            // Cleaning
            'cleaning.view',
            'cleaning.assign',
            'cleaning.update',
            'cleaning.verify',

            // Report
            'report.finance',
            'report.occupancy',
            'report.tenant',

            // System (Developer Only)
            'system.setting',
            'system.audit-log',
            'system.monitoring',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }
    }
}
