<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Owner;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Tenant;
use App\Models\UtilityReading;
use App\Models\UtilitySetting;
use App\Models\User;
use App\Enums\ContractStatus;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Enums\TenantStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $owner = Owner::first();
        if (!$owner) {
            $this->command?->error('No owner found. Run UserSeeder first.');
            return;
        }

        $ownerUser = User::where('id', $owner->user_id)->first();
        $properties = Property::where('owner_id', $owner->id)->get();
        $roomTypes = RoomType::where('property_id', $properties->first()->id)->get();

        $tenants = $this->createTenants();
        $contracts = $this->createContracts($tenants, $properties, $roomTypes, $ownerUser);
        $this->createInvoicesAndPayments($contracts, $properties, $ownerUser);
        $this->createExpenses($properties, $ownerUser);
        $this->createUtilityReadings($contracts, $properties);
        $this->updateRoomStatuses($properties);

        $this->command?->info('Dummy data seeded successfully!');
    }

    private function createTenants()
    {
        $tenantData = [
            ['name' => 'Andi Pratama', 'nik' => '3201234567890002', 'phone' => '081234567892', 'email' => 'andi@email.com', 'status' => TenantStatus::ACTIVE],
            ['name' => 'Dewi Lestari', 'nik' => '3201234567890003', 'phone' => '081234567893', 'email' => 'dewi@email.com', 'status' => TenantStatus::ACTIVE],
            ['name' => 'Rizki Ramadhan', 'nik' => '3201234567890004', 'phone' => '081234567894', 'email' => 'rizki@email.com', 'status' => TenantStatus::ACTIVE],
            ['name' => 'Putri Ayu', 'nik' => '3201234567890005', 'phone' => '081234567895', 'email' => 'putri@email.com', 'status' => TenantStatus::ACTIVE],
            ['name' => 'Fajar Nugroho', 'nik' => '3201234567890006', 'phone' => '081234567896', 'email' => 'fajar@email.com', 'status' => TenantStatus::ACTIVE],
            ['name' => 'Maya Sari', 'nik' => '3201234567890007', 'phone' => '081234567897', 'email' => 'maya@email.com', 'status' => TenantStatus::CHECKED_OUT],
            ['name' => 'Bambang Setiawan', 'nik' => '3201234567890008', 'phone' => '081234567898', 'email' => 'bambang@email.com', 'status' => TenantStatus::ACTIVE],
            ['name' => 'Rina Marlina', 'nik' => '3201234567890009', 'phone' => '081234567899', 'email' => 'rina@email.com', 'status' => TenantStatus::ACTIVE],
        ];

        $tenants = collect();
        foreach ($tenantData as $data) {
            $t = Tenant::create(array_merge($data, [
                'address' => 'Jl. Contoh No. ' . rand(1, 100) . ', Jakarta',
                'occupation' => 'Mahasiswa',
                'emergency_contact' => 'Orang Tua',
                'emergency_phone' => '081111222333',
            ]));
            $tenants->push($t);
        }

        return $tenants;
    }

    private function createContracts($tenants, $properties, $roomTypes, $ownerUser)
    {
        $contracts = collect();
        $roomNumbers = ['A01', 'A02', 'A03', 'A04', 'A05', 'B01', 'B02', 'B03'];

        foreach ($tenants as $idx => $tenant) {
            $property = $properties[$idx % $properties->count()];
            $room = Room::where('property_id', $property->id)
                ->where('number', $roomNumbers[$idx % count($roomNumbers)])
                ->first();

            if (!$room) continue;

            $isActive = $tenant->status === TenantStatus::ACTIVE;
            $startMonthsAgo = rand(1, 6);
            $startDate = now()->subMonths($startMonthsAgo)->startOfMonth()->addDays(rand(0, 5));

            $contract = Contract::create([
                'tenant_id' => $tenant->id,
                'room_id' => $room->id,
                'property_id' => $property->id,
                'contract_number' => 'CTR-' . str_pad($idx + 10, 4, '0', STR_PAD_LEFT),
                'start_date' => $startDate,
                'end_date' => $isActive ? null : $startDate->copy()->addMonths(rand(3, 12)),
                'monthly_price' => $room->price,
                'deposit_amount' => $room->price,
                'payment_day' => 1,
                'status' => $isActive ? ContractStatus::ACTIVE : ContractStatus::COMPLETED,
            ]);

            $room->update(['status' => $isActive ? 'occupied' : 'available']);
            $contracts->push($contract);
        }

        return $contracts;
    }

    private function createInvoicesAndPayments($contracts, $properties, $ownerUser)
    {
        $methods = ['cash', 'bank_transfer', 'ewallet'];
        $now = now();

        foreach ($contracts as $idx => $contract) {
            $tenant = $contract->tenant;
            $property = $contract->property;
            $startMonth = (int) $contract->start_date->format('m');
            $startYear = (int) $contract->start_date->format('Y');
            $contractMonths = [];

            for ($m = $startMonth, $y = $startYear; $y < $now->year || ($y == $now->year && $m <= $now->month); $m++) {
                if ($m > 12) { $m = 1; $y++; }
                $contractMonths[] = ['m' => $m, 'y' => $y];
            }

            $totalMonths = count($contractMonths);
            $paidCount = max(0, $totalMonths - rand(1, 2));
            $pendingCount = ($totalMonths > $paidCount) ? 1 : 0;
            $unpaidCount = $totalMonths - $paidCount - $pendingCount;

            $paidMonths = array_slice($contractMonths, 0, $paidCount);
            $pendingMonths = array_slice($contractMonths, $paidCount, $pendingCount);
            $unpaidMonths = array_slice($contractMonths, $paidCount + $pendingCount, $unpaidCount);

            foreach ($paidMonths as $pm) {
                $m = $pm['m'];
                $y = $pm['y'];
                $this->createInvoiceWithPayment($contract, $property, $m, $y, $methods[array_rand($methods)], $ownerUser, 'paid');
            }

            foreach ($pendingMonths as $pm) {
                $m = $pm['m'];
                $y = $pm['y'];
                $this->createInvoiceWithPayment($contract, $property, $m, $y, $methods[array_rand($methods)], $ownerUser, 'pending');
            }

            foreach ($unpaidMonths as $pm) {
                $m = $pm['m'];
                $y = $pm['y'];
                $this->createInvoiceWithPayment($contract, $property, $m, $y, null, $ownerUser, 'unpaid');
            }
        }
    }

    private function createInvoiceWithPayment($contract, $property, $m, $y, $method, $ownerUser, $status)
    {
        $periodDate = Carbon::create($y, $m, 1);
        $dueDate = $periodDate->copy()->addDays(15);

        $subtotal = (float) $contract->monthly_price;
        $electricityCost = rand(50, 200) * 1000;
        $waterCost = rand(20, 80) * 1000;
        $subtotal += $electricityCost + $waterCost;

        $invoice = Invoice::create([
            'tenant_id' => $contract->tenant_id,
            'room_id' => $contract->room_id,
            'property_id' => $property->id,
            'contract_id' => $contract->id,
            'invoice_number' => 'INV-' . $y . str_pad($m, 2, '0', STR_PAD_LEFT) . '-' . str_pad($contract->id, 4, '0', STR_PAD_LEFT),
            'period_month' => $m,
            'period_year' => $y,
            'due_date' => $dueDate,
            'subtotal' => $subtotal,
            'discount' => 0,
            'total_amount' => $subtotal,
            'status' => $status,
            'paid_at' => $status === 'paid' ? $periodDate->copy()->addDays(rand(1, 10)) : null,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'type' => 'rent',
            'name' => 'Sewa Bulanan',
            'quantity' => 1,
            'unit_price' => $contract->monthly_price,
            'amount' => $contract->monthly_price,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'type' => 'electricity',
            'name' => 'Listrik',
            'quantity' => 1,
            'unit_price' => $electricityCost,
            'amount' => $electricityCost,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'type' => 'water',
            'name' => 'Air',
            'quantity' => 1,
            'unit_price' => $waterCost,
            'amount' => $waterCost,
        ]);

        $payDate = $periodDate->copy()->addDays(rand(1, 10));

        if ($status === 'paid') {
            Payment::create([
                'invoice_id' => $invoice->id,
                'tenant_id' => $contract->tenant_id,
                'property_id' => $property->id,
                'payment_number' => 'PAY-' . $y . str_pad($m, 2, '0', STR_PAD_LEFT) . '-' . str_pad($contract->id, 4, '0', STR_PAD_LEFT),
                'amount' => $subtotal,
                'payment_method' => $method,
                'payment_date' => $payDate,
                'status' => 'confirmed',
                'confirmed_by' => $ownerUser->id,
                'confirmed_at' => $payDate->copy()->addHours(rand(1, 24)),
            ]);
        } elseif ($status === 'pending') {
            Payment::create([
                'invoice_id' => $invoice->id,
                'tenant_id' => $contract->tenant_id,
                'property_id' => $property->id,
                'payment_number' => 'PAY-' . $y . str_pad($m, 2, '0', STR_PAD_LEFT) . '-' . str_pad($contract->id, 4, '0', STR_PAD_LEFT),
                'amount' => $subtotal,
                'payment_method' => $method,
                'payment_date' => $payDate,
                'status' => 'pending',
                'notes' => 'Menunggu konfirmasi pembayaran',
            ]);
        }
    }

    private function createExpenses($properties, $ownerUser)
    {
        $expenseData = [
            ['title' => 'Bayar Listrik Gedung', 'amount' => 2500000, 'category_name' => 'Listrik'],
            ['title' => 'Bayar Air PAM', 'amount' => 1500000, 'category_name' => 'Air'],
            ['title' => 'Bayar Internet Indihome', 'amount' => 500000, 'category_name' => 'Internet'],
            ['title' => 'Gaji Security', 'amount' => 2000000, 'category_name' => 'Gaji Staff'],
            ['title' => 'Gaji Cleaning Service', 'amount' => 1800000, 'category_name' => 'Kebersihan'],
            ['title' => 'Perbaiki Pipa Bocor', 'amount' => 350000, 'category_name' => 'Maintenance'],
            ['title' => 'Beli Sabun dan Pembersih', 'amount' => 150000, 'category_name' => 'Kebersihan'],
            ['title' => 'Service AC Ruangan 101', 'amount' => 200000, 'category_name' => 'Maintenance'],
            ['title' => 'Bayar Keamanan Lingkungan', 'amount' => 300000, 'category_name' => 'Lainnya'],
            ['title' => 'Pajak Properti', 'amount' => 5000000, 'category_name' => 'Lainnya'],
        ];

        foreach ($properties as $property) {
            $categories = ExpenseCategory::where('property_id', $property->id)->get();

            for ($monthsAgo = 0; $monthsAgo < 6; $monthsAgo++) {
                $numExpenses = rand(2, 4);
                $chosen = collect($expenseData)->random($numExpenses);

                foreach ($chosen as $exp) {
                    $cat = $categories->firstWhere('name', $exp['category_name']);
                    $date = now()->subMonths($monthsAgo)->addDays(rand(1, 28));

                    Expense::create([
                        'property_id' => $property->id,
                        'expense_category_id' => $cat?->id,
                        'title' => $exp['title'],
                        'description' => $exp['title'] . ' bulan ' . $date->format('F Y'),
                        'amount' => $exp['amount'] + rand(-50000, 50000),
                        'expense_date' => $date,
                        'payment_method' => 'bank_transfer',
                        'created_by' => $ownerUser->id,
                    ]);
                }
            }
        }
    }

    private function createUtilityReadings($contracts, $properties)
    {
        foreach ($contracts as $contract) {
            if ($contract->status !== 'active') continue;

            $property = $contract->property;
            $electricitySetting = UtilitySetting::where('property_id', $property->id)->where('type', 'electricity')->first();
            $waterSetting = UtilitySetting::where('property_id', $property->id)->where('type', 'water')->first();

            if (!$electricitySetting || !$waterSetting) continue;

            $startMonth = (int) $contract->start_date->format('m');
            $startYear = (int) $contract->start_date->format('Y');
            $now = now();

            $lastElectricityEnd = (float) rand(1000, 5000);
            $lastWaterEnd = (float) rand(50, 200);

            for ($m = $startMonth, $y = $startYear; $y < $now->year || ($y == $now->year && $m <= $now->month); $m++) {
                if ($m > 12) { $m = 1; $y++; }

                $readingStart = $lastElectricityEnd;
                $usage = (float) rand(50, 200);
                $readingEnd = $readingStart + $usage;

                $exists = UtilityReading::where('room_id', $contract->room_id)
                    ->where('utility_setting_id', $electricitySetting->id)
                    ->where('period_month', $m)
                    ->where('period_year', $y)
                    ->exists();

                if (!$exists) {
                    UtilityReading::create([
                        'room_id' => $contract->room_id,
                        'property_id' => $property->id,
                        'utility_setting_id' => $electricitySetting->id,
                        'contract_id' => $contract->id,
                        'period_month' => $m,
                        'period_year' => $y,
                        'reading_start' => $readingStart,
                        'reading_end' => $readingEnd,
                        'usage_amount' => $usage,
                        'amount' => $usage * (float) $electricitySetting->rate,
                        'input_by' => $contract->tenant->user_id,
                        'input_at' => now(),
                    ]);
                }
                $lastElectricityEnd = $readingEnd;

                $wReadingStart = $lastWaterEnd;
                $wUsage = (float) rand(5, 20);
                $wReadingEnd = $wReadingStart + $wUsage;

                $wExists = UtilityReading::where('room_id', $contract->room_id)
                    ->where('utility_setting_id', $waterSetting->id)
                    ->where('period_month', $m)
                    ->where('period_year', $y)
                    ->exists();

                if (!$wExists) {
                    UtilityReading::create([
                        'room_id' => $contract->room_id,
                        'property_id' => $property->id,
                        'utility_setting_id' => $waterSetting->id,
                        'contract_id' => $contract->id,
                        'period_month' => $m,
                        'period_year' => $y,
                        'reading_start' => $wReadingStart,
                        'reading_end' => $wReadingEnd,
                        'usage_amount' => $wUsage,
                        'amount' => $wUsage * (float) $waterSetting->rate,
                        'input_by' => $contract->tenant->user_id,
                        'input_at' => now(),
                    ]);
                }
                $lastWaterEnd = $wReadingEnd;
            }
        }
    }

    private function updateRoomStatuses($properties)
    {
        $statuses = ['available', 'occupied', 'maintenance', 'cleaning'];

        foreach ($properties as $property) {
            $rooms = Room::where('property_id', $property->id)->get();
            foreach ($rooms as $room) {
                if ($room->status !== 'occupied') {
                    $room->update(['status' => $statuses[array_rand($statuses)]]);
                }
            }
        }
    }
}
