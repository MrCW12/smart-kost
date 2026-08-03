<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\CleaningTask;
use App\Models\Contract;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OwnerDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $ownerId = $request->user()->owner?->id ?? $request->user()->owner_id;

        if ($ownerId === null) {
            return $this->success([
                'summary' => [
                    'total_properties' => 0,
                    'total_rooms' => 0,
                    'available_rooms' => 0,
                    'occupied_rooms' => 0,
                    'total_tenants' => 0,
                    'occupancy_rate' => 0,
                ],
                'financial' => [
                    'total_revenue' => 0,
                    'total_expenses' => 0,
                    'profit' => 0,
                    'unpaid_invoices' => 0,
                    'overdue_invoices' => 0,
                    'pending_payments' => 0,
                ],
                'revenue' => [
                    'total_income' => 0,
                    'total_expenses' => 0,
                    'total_profit' => 0,
                    'current_month_income' => 0,
                    'current_month_expenses' => 0,
                    'current_month_profit' => 0,
                ],
                'operations' => [
                    'pending_cleaning' => 0,
                ],
                'recent_payments' => [],
                'monthly_revenue' => [],
            ]);
        }

        $properties = Property::where('owner_id', $ownerId)->pluck('id');

        $totalProperties = $properties->count();
        $totalRooms = Room::whereIn('property_id', $properties)->count();
        $availableRooms = Room::whereIn('property_id', $properties)->where('status', 'available')->count();
        $occupiedRooms = Room::whereIn('property_id', $properties)->where('status', 'occupied')->count();
        $totalTenants = Tenant::whereHas('contracts', function ($q) use ($properties) {
            $q->whereIn('property_id', $properties)->where('status', 'active');
        })->count();

        // Current month stats
        $currentMonth = now()->month;
        $currentYear = now()->year;

        $totalRevenue = Payment::whereIn('property_id', $properties)
            ->where('status', 'confirmed')
            ->whereMonth('payment_date', $currentMonth)
            ->whereYear('payment_date', $currentYear)
            ->sum('amount');

        $totalExpenses = Expense::whereIn('property_id', $properties)
            ->whereMonth('expense_date', $currentMonth)
            ->whereYear('expense_date', $currentYear)
            ->sum('amount');

        $profit = $totalRevenue - $totalExpenses;

        // All-time stats
        $allTimeRevenue = Payment::whereIn('property_id', $properties)
            ->where('status', 'confirmed')
            ->sum('amount');

        $allTimeExpenses = Expense::whereIn('property_id', $properties)->sum('amount');

        $unpaidInvoices = Invoice::whereIn('property_id', $properties)
            ->where('status', 'unpaid')
            ->count();

        $overdueInvoices = Invoice::whereIn('property_id', $properties)
            ->where('status', 'overdue')
            ->count();

        // Pending payments
        $pendingPayments = Payment::whereIn('property_id', $properties)
            ->where('status', 'pending')
            ->count();

        // Cleaning tasks
        $pendingCleaning = CleaningTask::whereIn('property_id', $properties)
            ->whereIn('status', ['waiting', 'in_progress'])
            ->count();

        // Recent payments
        $recentPayments = Payment::whereIn('property_id', $properties)
            ->where('status', 'confirmed')
            ->with('tenant')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'amount' => $p->amount,
                'tenant_name' => $p->tenant?->name,
                'payment_date' => $p->payment_date->format('Y-m-d'),
            ]);

        // Monthly revenue chart (last 6 months)
        $monthlyRevenue = Payment::whereIn('property_id', $properties)
            ->where('status', 'confirmed')
            ->where('payment_date', '>=', now()->subMonths(5)->startOfMonth())
            ->selectRaw('YEAR(payment_date) as year, MONTH(payment_date) as month, SUM(amount) as total')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(fn ($r) => [
                'month' => $r->month,
                'year' => $r->year,
                'total' => (float) $r->total,
            ]);

        return $this->success([
            'summary' => [
                'total_properties' => $totalProperties,
                'total_rooms' => $totalRooms,
                'available_rooms' => $availableRooms,
                'occupied_rooms' => $occupiedRooms,
                'total_tenants' => $totalTenants,
                'occupancy_rate' => $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0,
            ],
            'financial' => [
                'total_revenue' => (float) $totalRevenue,
                'total_expenses' => (float) $totalExpenses,
                'profit' => (float) $profit,
                'unpaid_invoices' => $unpaidInvoices,
                'overdue_invoices' => $overdueInvoices,
                'pending_payments' => $pendingPayments,
            ],
            'revenue' => [
                'total_income' => (float) $allTimeRevenue,
                'total_expenses' => (float) $allTimeExpenses,
                'total_profit' => (float) ($allTimeRevenue - $allTimeExpenses),
                'current_month_income' => (float) $totalRevenue,
                'current_month_expenses' => (float) $totalExpenses,
                'current_month_profit' => (float) $profit,
            ],
            'operations' => [
                'pending_cleaning' => $pendingCleaning,
            ],
            'recent_payments' => $recentPayments,
            'monthly_revenue' => $monthlyRevenue,
        ]);
    }
}
