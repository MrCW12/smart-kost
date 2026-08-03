<?php

namespace App\Enums;

enum UtilityType: string
{
    case ELECTRICITY = 'electricity';
    case WATER = 'water';
    case INTERNET = 'internet';
    case PARKING = 'parking';
    case GARBAGE = 'garbage';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::ELECTRICITY => 'Listrik',
            self::WATER => 'Air',
            self::INTERNET => 'Internet',
            self::PARKING => 'Parkir',
            self::GARBAGE => 'Sampah',
            self::OTHER => 'Lainnya',
        };
    }

    public function unit(): string
    {
        return match ($this) {
            self::ELECTRICITY => 'kWh',
            self::WATER => 'm3',
            self::INTERNET => 'bulan',
            self::PARKING => 'bulan',
            self::GARBAGE => 'bulan',
            self::OTHER => '',
        };
    }
}
