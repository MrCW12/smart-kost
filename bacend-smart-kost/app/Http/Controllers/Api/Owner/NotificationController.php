<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AppNotification::where('user_id', $request->user()->id)
            ->with('property:id,name')
            ->latest();

        $unreadCount = (clone $query)->whereNull('read_at')->count();

        $notifications = $query->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            $notifications->map(fn ($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'message' => $n->message,
                'data' => $n->data,
                'property' => $n->property ? [
                    'id' => $n->property->id,
                    'name' => $n->property->name,
                ] : null,
                'read_at' => $n->read_at?->toISOString(),
                'created_at' => $n->created_at?->toISOString(),
            ]),
            [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $unreadCount,
            ]
        );
    }

    public function markAllRead(Request $request): JsonResponse
    {
        AppNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->success(null, 'Semua notifikasi dibaca');
    }

    public function markRead(Request $request, AppNotification $notification): JsonResponse
    {
        if ($notification->user_id !== $request->user()->id) {
            return $this->forbidden('Unauthorized');
        }

        if (!$notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return $this->success([
            'id' => $notification->id,
            'read_at' => $notification->fresh()->read_at?->toISOString(),
        ], 'Notifikasi dibaca');
    }
}
