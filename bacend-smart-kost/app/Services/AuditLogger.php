<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    public static function log(string $action, $model = null, array $oldValues = [], array $newValues = [], ?int $userId = null): void
    {
        try {
            if ($action === 'update' && empty($oldValues) && empty($newValues)) {
                return;
            }

            AuditLog::create([
                'user_id' => $userId ?? (Auth::check() ? Auth::id() : null),
                'action' => $action,
                'model_type' => $model ? get_class($model) : null,
                'model_id' => $model?->getKey(),
                'old_values' => $oldValues ?: null,
                'new_values' => $newValues ?: null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Audit logging must never break the main flow.
        }
    }

    public static function sanitize(array $values): array
    {
        $exclude = array_flip([
            'password',
            'remember_token',
            'created_at',
            'updated_at',
            'deleted_at',
            'email_verified_at',
            'last_login_at',
        ]);

        return array_diff_key($values, $exclude);
    }
}
