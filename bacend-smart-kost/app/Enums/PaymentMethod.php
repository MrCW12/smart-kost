<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case CASH = 'cash';
    case BANK_TRANSFER = 'bank_transfer';
    case EWALLET = 'ewallet';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::CASH => 'Tunai',
            self::BANK_TRANSFER => 'Transfer Bank',
            self::EWALLET => 'E-Wallet',
            self::OTHER => 'Lainnya',
        };
    }
}
