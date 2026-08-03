<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\CleaningTask;
use App\Models\Room;
use App\Models\UtilityReading;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffDashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $propertyIds = $request->user()->properties->pluck('id');

        // Cleaning tasks
        $myCleaningTasks = CleaningTask::whereIn('property_id', $propertyIds)
            ->where(function ($q) use ($request) {
                $q->where('assigned_to', $request->user()->id)
                  ->orWhereNull('assigned_to');
            })
            ->whereIn('status', ['waiting', 'in_progress'])
            ->with('room')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'room_number' => $t->room?->number,
                'type' => $t->type,
                'status' => $t->status,
                'priority' => $t->priority,
                'started_at' => $t->started_at,
            ]);

        // Pending utility readings
        $pendingReadings = UtilityReading::whereIn('property_id', $propertyIds)
            ->whereNull('reading_end')
            ->where('period_month', now()->month)
            ->where('period_year', now()->year)
            ->with(['room', 'utilitySetting'])
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'room_number' => $r->room?->number,
                'utility_name' => $r->utilitySetting?->name,
                'reading_start' => $r->reading_start,
                'period_month' => $r->period_month,
                'period_year' => $r->period_year,
            ]);

        // My stats
        $completedToday = CleaningTask::where('assigned_to', $request->user()->id)
            ->whereDate('completed_at', now()->toDateString())
            ->count();

        $totalCompleted = CleaningTask::where('assigned_to', $request->user()->id)
            ->where('status', 'verified')
            ->count();

        return $this->success([
            'cleaning_tasks' => $myCleaningTasks,
            'pending_readings' => $pendingReadings,
            'stats' => [
                'completed_today' => $completedToday,
                'total_completed' => $totalCompleted,
            ],
        ]);
    }
}
