<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Dashboard\AdminDashboardController;
use App\Http\Controllers\Api\Dashboard\OwnerDashboardController;
use App\Http\Controllers\Api\Dashboard\StaffDashboardController;
use App\Http\Controllers\Api\Developer\AuditLogController;
use App\Http\Controllers\Api\Developer\PermissionController;
use App\Http\Controllers\Api\Developer\RoleController;
use App\Http\Controllers\Api\Developer\SwitchOwnerController;
use App\Http\Controllers\Api\Developer\UserController as DeveloperUserController;
use App\Http\Controllers\Api\Owner\CleaningTaskController;
use App\Http\Controllers\Api\Owner\ContractController;
use App\Http\Controllers\Api\Owner\ExpenseController;
use App\Http\Controllers\Api\Owner\InvoiceController;
use App\Http\Controllers\Api\Owner\NotificationController;
use App\Http\Controllers\Api\Owner\PaymentController;
use App\Http\Controllers\Api\Owner\PropertyController;
use App\Http\Controllers\Api\Owner\ReportController;
use App\Http\Controllers\Api\Owner\RoomController;
use App\Http\Controllers\Api\Owner\RoomTypeController;
use App\Http\Controllers\Api\Owner\TaskGroupController;
use App\Http\Controllers\Api\Owner\TenantController;
use App\Http\Controllers\Api\Owner\UtilityController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Public Routes
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/register', [AuthController::class, 'register']);

    // Protected Routes
    Route::middleware(['auth:sanctum', 'ensure.user.active'])->group(function () {

        // Auth
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('auth/password', [AuthController::class, 'changePassword']);
        Route::post('auth/avatar', [AuthController::class, 'uploadAvatar']);

        // Developer Routes
        Route::middleware('role:developer')->prefix('developer')->group(function () {
            Route::apiResource('users', DeveloperUserController::class);
            Route::put('users/{user}/permissions', [DeveloperUserController::class, 'syncPermissions'])->name('users.permissions.sync');
            Route::get('owners', [DeveloperUserController::class, 'owners'])->name('owners.index');
            Route::post('switch-owner/{user}', SwitchOwnerController::class)->name('switch-owner');
            Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
            Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
            Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
        });

        // Owner & Admin Routes - Properties
        Route::middleware('role:developer|owner|admin|staff')->group(function () {
            Route::middleware('can:property.view')->group(function () {
                Route::get('properties', [PropertyController::class, 'index']);
                Route::get('properties/{property}', [PropertyController::class, 'show']);
            });
            Route::post('properties', [PropertyController::class, 'store'])->middleware('can:property.create');
            Route::put('properties/{property}', [PropertyController::class, 'update'])->middleware('can:property.update');
            Route::delete('properties/{property}', [PropertyController::class, 'destroy'])->middleware('can:property.delete');

            Route::middleware('can:room-type.view')->group(function () {
                Route::get('properties/{property}/room-types', [RoomTypeController::class, 'index']);
                Route::get('properties/{property}/room-types/{roomType}', [RoomTypeController::class, 'show']);
            });
            Route::post('properties/{property}/room-types', [RoomTypeController::class, 'store'])->middleware('can:room-type.create');
            Route::put('properties/{property}/room-types/{roomType}', [RoomTypeController::class, 'update'])->middleware('can:room-type.update');
            Route::delete('properties/{property}/room-types/{roomType}', [RoomTypeController::class, 'destroy'])->middleware('can:room-type.delete');

            Route::middleware('can:room.view')->group(function () {
                Route::get('properties/{property}/rooms', [RoomController::class, 'index']);
                Route::get('properties/{property}/rooms/{room}', [RoomController::class, 'show']);
            });
            Route::post('properties/{property}/rooms', [RoomController::class, 'store'])->middleware('can:room.create');
            Route::put('properties/{property}/rooms/{room}', [RoomController::class, 'update'])->middleware('can:room.update');
            Route::delete('properties/{property}/rooms/{room}', [RoomController::class, 'destroy'])->middleware('can:room.delete');
            Route::patch('properties/{property}/rooms/{room}/status', [RoomController::class, 'updateStatus'])->middleware('can:room.update-status');
        });

        // All Roles - Tenants & Contracts (permission-gated)
        Route::middleware('role:developer|owner|admin|staff')->group(function () {
            Route::middleware('can:tenant.view')->group(function () {
                Route::get('tenants', [TenantController::class, 'index']);
                Route::get('tenants/{tenant}', [TenantController::class, 'show']);
                Route::get('tenants/{tenant}/checkout-preview', [TenantController::class, 'checkoutPreview'])->name('tenants.checkout-preview');
            });
            Route::post('tenants', [TenantController::class, 'store'])->middleware('can:tenant.create');
            Route::put('tenants/{tenant}', [TenantController::class, 'update'])->middleware('can:tenant.update');
            Route::delete('tenants/{tenant}', [TenantController::class, 'destroy'])->middleware('can:tenant.delete');
            Route::post('tenants/{tenant}/checkout', [TenantController::class, 'checkout'])->middleware('can:tenant.check-out');

            Route::middleware('can:contract.view')->group(function () {
                Route::get('contracts', [ContractController::class, 'index']);
                Route::get('contracts/{contract}', [ContractController::class, 'show']);
            });
            Route::put('contracts/{contract}', [ContractController::class, 'update'])->middleware('can:contract.update');
        });

        // Owner & Admin Routes - Utility
        Route::middleware('role:developer|owner|admin|staff')->group(function () {
            Route::middleware('can:utility.setting')->group(function () {
                Route::get('properties/{property}/utility-settings', [UtilityController::class, 'indexSettings']);
                Route::post('properties/{property}/utility-settings', [UtilityController::class, 'storeSetting']);
                Route::put('properties/{property}/utility-settings/{setting}', [UtilityController::class, 'updateSetting']);
                Route::delete('properties/{property}/utility-settings/{setting}', [UtilityController::class, 'destroySetting']);
            });
            Route::middleware('can:utility.input-reading')->group(function () {
                Route::get('utility-readings', [UtilityController::class, 'indexReadings']);
                Route::post('utility-readings', [UtilityController::class, 'storeReading']);
                Route::put('utility-readings/{reading}', [UtilityController::class, 'updateReading']);
            });
        });

        // All Roles - Invoice (permission-gated)
        Route::middleware('role:developer|owner|admin|staff')->group(function () {
            Route::middleware('can:invoice.view')->group(function () {
                Route::get('invoices', [InvoiceController::class, 'index']);
                Route::get('invoices/{invoice}', [InvoiceController::class, 'show']);
                Route::get('contracts/{contract}/billing-data', [InvoiceController::class, 'billingData']);
            });
            Route::post('invoices', [InvoiceController::class, 'store'])->middleware('can:invoice.generate');
            Route::post('invoices/generate', [InvoiceController::class, 'generate'])->middleware('can:invoice.generate');
            Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('can:invoice.cancel');
            Route::patch('invoices/{invoice}/status', [InvoiceController::class, 'updateStatus'])->middleware('can:invoice.update');
        });

        // All Roles - Payment (permission-gated)
        Route::middleware('role:developer|owner|admin|staff')->group(function () {
            Route::middleware('can:payment.view')->group(function () {
                Route::get('payments', [PaymentController::class, 'index']);
                Route::get('payments/{payment}', [PaymentController::class, 'show']);
            });
            Route::post('payments', [PaymentController::class, 'store'])->middleware('can:payment.create');
            Route::patch('payments/{payment}/confirm', [PaymentController::class, 'confirm'])->middleware('can:payment.confirm');
            Route::patch('payments/{payment}/reject', [PaymentController::class, 'reject'])->middleware('can:payment.reject');
            Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->middleware('can:payment.reject');
        });

        // All Roles - Expense (permission-gated)
        Route::middleware('role:developer|owner|admin|staff')->group(function () {
            Route::middleware('can:expense.view')->group(function () {
                Route::get('expenses', [ExpenseController::class, 'index']);
                Route::get('expenses/{expense}', [ExpenseController::class, 'show']);
                Route::get('properties/{property}/expense-categories', [ExpenseController::class, 'categories']);
            });
            Route::post('expenses', [ExpenseController::class, 'store'])->middleware('can:expense.create');
            Route::put('expenses/{expense}', [ExpenseController::class, 'update'])->middleware('can:expense.update');
            Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy'])->middleware('can:expense.delete');
        });

        // All Roles - Cleaning & Maintenance Tasks
        Route::middleware('can:cleaning.view')->group(function () {
            Route::get('cleaning-tasks', [CleaningTaskController::class, 'index']);
            Route::get('cleaning-tasks/assignable-users', [CleaningTaskController::class, 'assignableUsers']);
            Route::get('cleaning-tasks/{cleaningTask}', [CleaningTaskController::class, 'show']);
        });
        Route::post('cleaning-tasks', [CleaningTaskController::class, 'store'])->middleware('can:cleaning.assign');
        Route::patch('cleaning-tasks/{cleaningTask}/status', [CleaningTaskController::class, 'updateStatus'])->middleware('can:cleaning.update');
        Route::post('cleaning-tasks/{cleaningTask}/photos', [CleaningTaskController::class, 'addPhoto'])->middleware('can:cleaning.update');

        // Task Groups (helpdesk-like) - all roles view, manage by owner/admin/dev
        Route::middleware('can:cleaning.view')->group(function () {
            Route::get('task-groups', [TaskGroupController::class, 'index']);
            Route::get('task-groups/candidates', [TaskGroupController::class, 'candidates']);
        });
        Route::middleware('role:developer|owner|admin')->group(function () {
            Route::post('task-groups', [TaskGroupController::class, 'store'])->middleware('can:cleaning.assign');
            Route::put('task-groups/{taskGroup}', [TaskGroupController::class, 'update'])->middleware('can:cleaning.assign');
            Route::delete('task-groups/{taskGroup}', [TaskGroupController::class, 'destroy'])->middleware('can:cleaning.assign');
        });

        // Notifications (owner/admin/dev)
        Route::middleware('role:developer|owner|admin')->group(function () {
            Route::get('notifications', [NotificationController::class, 'index']);
            Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
            Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead']);
        });

        // Dashboard Routes
        Route::middleware('role:developer|owner')->get('dashboard/owner', OwnerDashboardController::class);
        Route::middleware('role:developer|owner|admin')->get('dashboard/admin', AdminDashboardController::class);
        Route::middleware('role:developer|owner|admin|staff')->get('dashboard/staff', StaffDashboardController::class);

        // Report Routes (permission-gated)
        Route::middleware('role:developer|owner|admin|staff')->group(function () {
            Route::get('reports/finance', [ReportController::class, 'finance'])->middleware('can:report.finance');
            Route::get('reports/occupancy', [ReportController::class, 'occupancy'])->middleware('can:report.occupancy');
            Route::get('reports/tenant', [ReportController::class, 'tenant'])->middleware('can:report.tenant');
        });

    });

});
