<?php

namespace App\Http\Controllers\Api\Developer;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    private const MODULE_LABELS = [
        'user' => 'User Management',
        'role' => 'Role & Permission',
        'owner' => 'Owner',
        'property' => 'Property',
        'room-type' => 'Room Type',
        'room' => 'Room',
        'tenant' => 'Tenant',
        'contract' => 'Contract',
        'utility' => 'Utility',
        'invoice' => 'Invoice',
        'payment' => 'Payment',
        'expense' => 'Expense',
        'cleaning' => 'Cleaning & Task',
        'report' => 'Report',
        'system' => 'System',
    ];

    public function index(): JsonResponse
    {
        $permissions = Permission::orderBy('id')->get()->map(fn ($p) => [
            'name' => $p->name,
            'module' => $this->moduleLabel($p->name),
        ]);

        $grouped = collect($permissions)->groupBy('module')->map(function ($items, $module) {
            return [
                'module' => $module,
                'items' => $items->pluck('name')->values()->toArray(),
            ];
        })->values()->toArray();

        return $this->success($grouped);
    }

    private function moduleLabel(string $permission): string
    {
        $prefix = explode('.', $permission)[0];

        return self::MODULE_LABELS[$prefix] ?? ucfirst($prefix);
    }
}
