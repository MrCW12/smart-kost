<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use App\Models\Property;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $properties = Property::all();

        $categories = [
            ['name' => 'Listrik', 'description' => 'Tagihan listrik'],
            ['name' => 'Air', 'description' => 'Tagihan air'],
            ['name' => 'Internet', 'description' => 'Tagihan internet'],
            ['name' => 'Maintenance', 'description' => 'Perawatan dan perbaikan'],
            ['name' => 'Gaji Staff', 'description' => 'Gaji staff operasional'],
            ['name' => 'Kebersihan', 'description' => 'Perlengkapan kebersihan'],
            ['name' => 'Lainnya', 'description' => 'Pengeluaran lainnya'],
        ];

        foreach ($properties as $property) {
            foreach ($categories as $category) {
                ExpenseCategory::create([
                    'property_id' => $property->id,
                    ...$category,
                    'is_active' => true,
                ]);
            }
        }
    }
}
