<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use \App\Traits\ScopedByProperty;
    public function finance(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'nullable|exists:properties,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $query = $this->getPropertyQuery($request);

        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // Revenue
        $payments = Payment::where('status', 'confirmed')
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->when($query, fn ($q) => $q->whereIn('property_id', $query))
            ->selectRaw('SUM(amount) as total, payment_method')
            ->groupBy('payment_method')
            ->get();

        $totalRevenue = $payments->sum('total');

        // Expenses
        $expenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->when($query, fn ($q) => $q->whereIn('property_id', $query))
            ->selectRaw('SUM(amount) as total')
            ->first();

        $totalExpenses = $expenses->total ?? 0;

        // Profit
        $profit = $totalRevenue - $totalExpenses;

        // Expenses by category
        $expensesByCategory = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->when($query, fn ($q) => $q->whereIn('expenses.property_id', $query))
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->selectRaw('expense_categories.name as category, SUM(expenses.amount) as total')
            ->groupBy('expense_categories.name')
            ->get();

        // Monthly breakdown
        $monthlyData = Payment::where('status', 'confirmed')
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->when($query, fn ($q) => $q->whereIn('property_id', $query))
            ->selectRaw('YEAR(payment_date) as year, MONTH(payment_date) as month, SUM(amount) as revenue')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        $monthlyExpenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->when($query, fn ($q) => $q->whereIn('property_id', $query))
            ->selectRaw('YEAR(expense_date) as year, MONTH(expense_date) as month, SUM(amount) as expense')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        $monthlyBreakdown = $monthlyData->map(function ($m) use ($monthlyExpenses) {
            $expense = $monthlyExpenses->firstWhere('month', $m->month)?->expense ?? 0;
            return [
                'month' => $m->month,
                'year' => $m->year,
                'revenue' => (float) $m->revenue,
                'expense' => (float) $expense,
                'profit' => (float) $m->revenue - $expense,
            ];
        });

        return $this->success([
            'summary' => [
                'total_revenue' => (float) $totalRevenue,
                'total_expenses' => (float) $totalExpenses,
                'profit' => (float) $profit,
                'period' => ['start' => $startDate, 'end' => $endDate],
            ],
            'revenue_by_method' => $payments,
            'expenses_by_category' => $expensesByCategory,
            'monthly_breakdown' => $monthlyBreakdown,
        ]);
    }

    public function occupancy(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'nullable|exists:properties,id',
        ]);

        $query = $this->getPropertyQuery($request);

        // Current occupancy
        $rooms = Room::when($query, fn ($q) => $q->whereIn('property_id', $query));
        $totalRooms = $rooms->count();
        $availableRooms = (clone $rooms)->where('status', 'available')->count();
        $occupiedRooms = (clone $rooms)->where('status', 'occupied')->count();
        $maintenanceRooms = (clone $rooms)->where('status', 'maintenance')->count();
        $cleaningRooms = (clone $rooms)->where('status', 'cleaning')->count();

        // Occupancy by property
        $occupancyByProperty = Property::when($query, fn ($q) => $q->whereIn('id', $query))
            ->withCount(['rooms as total_rooms'])
            ->withCount(['rooms as occupied_rooms' => function ($q) {
                $q->where('status', 'occupied');
            }])
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'total_rooms' => $p->total_rooms,
                'occupied_rooms' => $p->occupied_rooms,
                'occupancy_rate' => $p->total_rooms > 0
                    ? round(($p->occupied_rooms / $p->total_rooms) * 100, 1)
                    : 0,
            ]);

        // Recent check-ins and check-outs
        $recentCheckins = Contract::when($query, fn ($q) => $q->whereIn('property_id', $query))
            ->with(['tenant', 'room'])
            ->where('start_date', '>=', now()->subDays(30))
            ->latest('start_date')
            ->limit(10)
            ->get()
            ->map(fn ($c) => [
                'tenant_name' => $c->tenant?->name,
                'room_number' => $c->room?->number,
                'start_date' => $c->start_date->format('Y-m-d'),
            ]);

        $recentCheckouts = Contract::when($query, fn ($q) => $q->whereIn('property_id', $query))
            ->with(['tenant', 'room'])
            ->whereNotNull('end_date')
            ->where('end_date', '>=', now()->subDays(30))
            ->latest('end_date')
            ->limit(10)
            ->get()
            ->map(fn ($c) => [
                'tenant_name' => $c->tenant?->name,
                'room_number' => $c->room?->number,
                'end_date' => $c->end_date->format('Y-m-d'),
            ]);

        return $this->success([
            'summary' => [
                'total_rooms' => $totalRooms,
                'available' => $availableRooms,
                'occupied' => $occupiedRooms,
                'maintenance' => $maintenanceRooms,
                'cleaning' => $cleaningRooms,
                'occupancy_rate' => $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0,
            ],
            'by_property' => $occupancyByProperty,
            'recent_checkins' => $recentCheckins,
            'recent_checkouts' => $recentCheckouts,
        ]);
    }

    public function tenant(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'nullable|exists:properties,id',
        ]);

        $query = $this->getPropertyQuery($request);

        // Active tenants
        $activeTenants = Tenant::whereHas('contracts', function ($q) use ($query) {
            $q->where('status', 'active');
            if ($query) {
                $q->whereIn('property_id', $query);
            }
        })->count();

        // Total tenants
        $totalTenants = Tenant::when($query, function ($q) use ($query) {
            $q->whereHas('contracts', fn ($cq) => $cq->whereIn('property_id', $query));
        })->count();

        // New tenants this month
        $newTenantsThisMonth = Contract::when($query, fn ($q) => $q->whereIn('property_id', $query))
            ->whereMonth('start_date', now()->month)
            ->whereYear('start_date', now()->year)
            ->count();

        // Tenants by property
        $tenantsByProperty = Property::when($query, fn ($q) => $q->whereIn('id', $query))
            ->withCount(['rooms as total_rooms'])
            ->withCount(['rooms as occupied_rooms' => function ($q) {
                $q->where('status', 'occupied');
            }])
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'total_rooms' => $p->total_rooms,
                'occupied_rooms' => $p->occupied_rooms,
            ]);

        // Recent tenants
        $recentTenants = Tenant::whereHas('contracts', function ($q) use ($query) {
            if ($query) {
                $q->whereIn('property_id', $query);
            }
        })
        ->with('activeContract.room')
        ->latest()
        ->limit(10)
        ->get()
        ->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'phone' => $t->phone,
            'status' => $t->status->value,
            'room_number' => $t->activeContract?->room?->number,
        ]);

        return $this->success([
            'summary' => [
                'total_tenants' => $totalTenants,
                'active_tenants' => $activeTenants,
                'new_this_month' => $newTenantsThisMonth,
            ],
            'by_property' => $tenantsByProperty,
            'recent_tenants' => $recentTenants,
        ]);
    }

    private function getPropertyQuery(Request $request): ?array
    {
        if ($request->property_id) {
            return [$request->property_id];
        }

        return $this->getUserPropertyIds($request) ?: null;
    }
}
