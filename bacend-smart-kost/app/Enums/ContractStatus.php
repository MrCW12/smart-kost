<?php

namespace App\Enums;

enum ContractStatus: string
{
    case ACTIVE = 'active';
    case EXPIRED = 'expired';
    case TERMINATED = 'terminated';
    case COMPLETED = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Aktif',
            self::EXPIRED => 'Kadaluarsa',
            self::TERMINATED => 'Dihentikan',
            self::COMPLETED => 'Selesai',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::ACTIVE => 'green',
            self::EXPIRED => 'yellow',
            self::TERMINATED => 'red',
            self::COMPLETED => 'gray',
        };
    }
}
