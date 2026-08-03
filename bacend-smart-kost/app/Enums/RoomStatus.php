<?php

namespace App\Enums;

enum RoomStatus: string
{
    case AVAILABLE = 'available';
    case OCCUPIED = 'occupied';
    case CHECKOUT_PROCESS = 'checkout_process';
    case CLEANING = 'cleaning';
    case READY_TO_RENT = 'ready_to_rent';
    case MAINTENANCE = 'maintenance';

    public function label(): string
    {
        return match ($this) {
            self::AVAILABLE => 'Tersedia',
            self::OCCUPIED => 'Terisi',
            self::CHECKOUT_PROCESS => 'Proses Checkout',
            self::CLEANING => 'Dalam Pembersihan',
            self::READY_TO_RENT => 'Siap Disewa',
            self::MAINTENANCE => 'Maintenance',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::AVAILABLE => 'green',
            self::OCCUPIED => 'blue',
            self::CHECKOUT_PROCESS => 'yellow',
            self::CLEANING => 'orange',
            self::READY_TO_RENT => 'cyan',
            self::MAINTENANCE => 'red',
        };
    }
}
