<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case DRAFT = 'draft';
    case UNPAID = 'unpaid';
    case PENDING = 'pending';
    case PARTIAL = 'partial';
    case PAID = 'paid';
    case OVERDUE = 'overdue';
    case CANCELLED = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::UNPAID => 'Belum Bayar',
            self::PENDING => 'Menunggu Pembayaran',
            self::PARTIAL => 'Bayar Sebagian',
            self::PAID => 'Lunas',
            self::OVERDUE => 'Jatuh Tempo',
            self::CANCELLED => 'Dibatalkan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT => 'gray',
            self::UNPAID => 'yellow',
            self::PENDING => 'blue',
            self::PARTIAL => 'orange',
            self::PAID => 'green',
            self::OVERDUE => 'red',
            self::CANCELLED => 'red',
        };
    }
}
