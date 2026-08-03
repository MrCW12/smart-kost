<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\CleaningTask;
use App\Models\Contract;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\UtilityReading;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $propertyIds = $request->user()->properties->pluck('id');

        $totalProperties = $propertyIds->count();
        $totalTenants = Tenant::whereHas('contracts', function ($q) use ($propertyIds) {
            $q->whereIn('property_id', $propertyIds)->where('status', 'active');
        })->count();

        $totalRooms = Room::whereIn('property_id', $propertyIds)->count();
        $availableRooms = Room::whereIn('property_id', $propertyIds)->where('status', 'available')->count();
        $occupiedRooms = Room::whereIn('property_id', $propertyIds)->where('status', 'occupied')->count();

        // Revenue stats
        $currentMonth = now()->month;
        $currentYear = now()->year;

        $totalRevenue = Payment::whereIn('property_id', $propertyIds)
            ->where('status', 'confirmed')
            ->whereMonth('payment_date', $currentMonth)
            ->whereYear('payment_date', $currentYear)
            ->sum('amount');

        $totalExpenses = Expense::whereIn('property_id', $propertyIds)
            ->whereMonth('expense_date', $currentMonth)
            ->whereYear('expense_date', $currentYear)
            ->sum('amount');

        $profit = $totalRevenue - $totalExpenses;

        $allTimeRevenue = Payment::whereIn('property_id', $propertyIds)
            ->where('status', 'confirmed')
            ->sum('amount');

        $allTimeExpenses = Expense::whereIn('property_id', $propertyIds)->sum('amount');

        // Today's activities
        $todayCheckins = Contract::whereIn('property_id', $propertyIds)
            ->where('start_date', Carbon::today())
            ->count();

        $todayCheckouts = Contract::whereIn('property_id', $propertyIds)
            ->where('end_date', Carbon::today())
            ->count();

        // Pending tasks
        $pendingUtilityReadings = UtilityReading::whereIn('property_id', $propertyIds)
            ->whereNull('reading_end')
            ->where('period_month', now()->month)
            ->where('period_year', now()->year)
            ->count();

        $pendingCleaning = CleaningTask::whereIn('property_id', $propertyIds)
            ->whereIn('status', ['waiting', 'in_progress'])
            ->count();

        // Pending payments
        $pendingPayments = Payment::whereIn('property_id', $propertyIds)
            ->where('status', 'pending')
            ->count();

        $unpaidInvoices = Invoice::whereIn('property_id', $propertyIds)
            ->where('status', 'unpaid')
            ->count();

        // Recent tenants
        $recentTenants = Tenant::whereHas('contracts', function ($q) use ($propertyIds) {
            $q->whereIn('property_id', $propertyIds)->where('status', 'active');
        })
        ->with('activeContract.room')
        ->latest()
        ->limit(5)
        ->get()
        ->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'room_number' => $t->activeContract?->room?->number,
        ]);

        return $this->success([
            'summary' => [
                'total_properties' => $totalProperties,
                'total_tenants' => $totalTenants,
                'total_rooms' => $totalRooms,
                'available_rooms' => $availableRooms,
                'occupied_rooms' => $occupiedRooms,
                'occupancy_rate' => $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0,
            ],
            'revenue' => [
                'total_income' => (float) $allTimeRevenue,
                'total_expenses' => (float) $allTimeExpenses,
                'total_profit' => (float) ($allTimeRevenue - $allTimeExpenses),
                'current_month_income' => (float) $totalRevenue,
                'current_month_expenses' => (float) $totalExpenses,
                'current_month_profit' => (float) $profit,
            ],
            'today' => [
                'checkins' => $todayCheckins,
                'checkouts' => $todayCheckouts,
            ],
            'pending_tasks' => [
                'utility_readings' => $pendingUtilityReadings,
                'cleaning' => $pendingCleaning,
                'payments' => $pendingPayments,
                'unpaid_invoices' => $unpaidInvoices,
            ],
            'recent_tenants' => $recentTenants,
        ]);
    }
}
