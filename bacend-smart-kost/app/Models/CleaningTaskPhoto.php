<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CleaningTaskPhoto extends Model
{
    use Auditable;

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
