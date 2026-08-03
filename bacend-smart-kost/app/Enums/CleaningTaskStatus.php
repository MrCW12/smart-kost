<?php

namespace App\Enums;

enum CleaningTaskStatus: string
{
    case WAITING = 'waiting';
    case IN_PROGRESS = 'in_progress';
    case DONE = 'done';
    case VERIFIED = 'verified';

    public function label(): string
    {
        return match ($this) {
            self::WAITING => 'Menunggu',
            self::IN_PROGRESS => 'Dikerjakan',
            self::DONE => 'Selesai',
            self::VERIFIED => 'Diverifikasi',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::WAITING => 'yellow',
            self::IN_PROGRESS => 'blue',
            self::DONE => 'orange',
            self::VERIFIED => 'green',
        };
    }
}
