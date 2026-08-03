<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CleaningTaskPhoto extends Model
{
    protected $fillable = [
        'cleaning_task_id',
        'path',
        'type',
        'caption',
    ];

    public function cleaningTask(): BelongsTo
    {
        return $this->belongsTo(CleaningTask::class);
    }
}
