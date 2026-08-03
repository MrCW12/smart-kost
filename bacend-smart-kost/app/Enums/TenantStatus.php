<?php

namespace App\Enums;

enum TenantStatus: string
{
    case ACTIVE = 'active';
    case CHECKED_OUT = 'checked_out';
    case BLACKLISTED = 'blacklisted';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Aktif',
            self::CHECKED_OUT => 'Sudah Checkout',
            self::BLACKLISTED => 'Blacklist',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::ACTIVE => 'green',
            self::CHECKED_OUT => 'gray',
            self::BLACKLISTED => 'red',
        };
    }
}
