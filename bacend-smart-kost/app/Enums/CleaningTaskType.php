<?php

namespace App\Enums;

enum CleaningTaskType: string
{
    case CLEANING = 'cleaning';
    case CHECKOUT = 'checkout';
    case PERIODIC = 'periodic';
    case MAINTENANCE = 'maintenance';
    case REQUEST = 'request';

    public function label(): string
    {
        return match ($this) {
            self::CLEANING => 'Pembersihan',
            self::CHECKOUT => 'Checkout',
            self::PERIODIC => 'Berkala',
            self::MAINTENANCE => 'Maintenance',
            self::REQUEST => 'Permintaan',
        };
    }
}
