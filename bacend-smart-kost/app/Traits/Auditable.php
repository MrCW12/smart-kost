<?php

namespace App\Traits;

use App\Services\AuditLogger;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            AuditLogger::log(
                'create',
                $model,
                [],
                AuditLogger::sanitize($model->getAttributes())
            );
        });

        static::updated(function ($model) {
            $dirty = AuditLogger::sanitize($model->getDirty());
            $old = [];

            foreach (array_keys($dirty) as $key) {
                $old[$key] = $model->getOriginal($key);
            }

            AuditLogger::log('update', $model, $old, $dirty);
        });

        static::deleted(function ($model) {
            AuditLogger::log(
                'delete',
                $model,
                AuditLogger::sanitize($model->getAttributes()),
                []
            );
        });
    }
}
