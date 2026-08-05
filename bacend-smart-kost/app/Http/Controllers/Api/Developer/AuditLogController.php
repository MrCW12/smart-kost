<?php

namespace App\Http\Controllers\Api\Developer;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with('user');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->action) {
            $query->where('action', $request->action);
        }

        if ($request->model) {
            $query->where('model_type', 'like', "%{$request->model}%");
        } elseif ($request->model_type) {
            $query->where('model_type', $request->model_type);
        }

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('action', 'like', "%{$request->q}%")
                    ->orWhere('ip_address', 'like', "%{$request->q}%")
                    ->orWhere('model_type', 'like', "%{$request->q}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$request->q}%"));
            });
        }

        if ($request->from) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->to) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $logs = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            $logs->map(fn ($log) => [
                'id' => $log->id,
                'user' => $log->user ? $log->user->name : 'System',
                'action' => $log->action,
                'model_type' => $log->model_type ? class_basename($log->model_type) : null,
                'model_id' => $log->model_id,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at,
            ]),
            [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'filters' => [
                    'actions' => AuditLog::query()
                        ->select('action')
                        ->distinct()
                        ->orderBy('action')
                        ->pluck('action')
                        ->values(),
                    'models' => AuditLog::query()
                        ->select('model_type')
                        ->whereNotNull('model_type')
                        ->distinct()
                        ->orderBy('model_type')
                        ->pluck('model_type')
                        ->values()
                        ->map(fn ($type) => class_basename($type)),
                    'users' => AuditLog::query()
                        ->select('user_id')
                        ->whereNotNull('user_id')
                        ->distinct()
                        ->with('user:id,name')
                        ->get()
                        ->map(fn ($log) => [
                            'id' => $log->user_id,
                            'name' => $log->user->name ?? 'System',
                        ])
                        ->sortBy('name')
                        ->values(),
                ],
            ]
        );
    }
}
