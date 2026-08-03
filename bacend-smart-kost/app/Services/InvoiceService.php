<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\UtilityReading;
use App\Models\UtilitySetting;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function generateMonthlyInvoice(Contract $contract, int $month, int $year): ?Invoice
    {
        $existingInvoice = Invoice::where('tenant_id', $contract->tenant_id)
            ->where('period_month', $month)
            ->where('period_year', $year)
            ->first();

        if ($existingInvoice) {
            return null;
        }

        return DB::transaction(function () use ($contract, $month, $year) {
            $invoice = Invoice::create([
                'tenant_id' => $contract->tenant_id,
                'room_id' => $contract->room_id,
                'property_id' => $contract->property_id,
                'contract_id' => $contract->id,
                'invoice_number' => Invoice::generateInvoiceNumber(),
                'period_month' => $month,
                'period_year' => $year,
                'due_date' => now()->setDate($year, $month, $contract->payment_day),
                'subtotal' => 0,
                'total_amount' => 0,
                'status' => InvoiceStatus::UNPAID,
            ]);

            $this->addRentItem($invoice, $contract);
            $this->addUtilityItems($invoice, $contract, $month, $year);
            $this->recalculateInvoice($invoice);

            return $invoice;
        });
    }

    public function createSingleInvoice(
        Contract $contract,
        int $month,
        int $year,
        ?array $utilityReadings,
        ?array $additionalCharges
    ): Invoice {
        $existingInvoice = Invoice::where('tenant_id', $contract->tenant_id)
            ->where('period_month', $month)
            ->where('period_year', $year)
            ->first();

        if ($existingInvoice) {
            throw new \Exception('Invoice already exists for this period');
        }

        return DB::transaction(function () use ($contract, $month, $year, $utilityReadings, $additionalCharges) {
            $invoice = Invoice::create([
                'tenant_id' => $contract->tenant_id,
                'room_id' => $contract->room_id,
                'property_id' => $contract->property_id,
                'contract_id' => $contract->id,
                'invoice_number' => Invoice::generateInvoiceNumber(),
                'period_month' => $month,
                'period_year' => $year,
                'due_date' => now()->setDate($year, $month, $contract->payment_day),
                'subtotal' => 0,
                'total_amount' => 0,
                'status' => InvoiceStatus::UNPAID,
            ]);

            // 1. Add rent item
            $this->addRentItem($invoice, $contract);

            // 2. Process utility readings (listrik, air, dll)
            if (!empty($utilityReadings)) {
                foreach ($utilityReadings as $readingData) {
                    $setting = UtilitySetting::find($readingData['utility_setting_id']);
                    if (!$setting) continue;

                    $usage = $readingData['reading_end'] - $readingData['reading_start'];
                    $billableUsage = max(0, $usage - $setting->min_usage);
                    $amount = $billableUsage * $setting->rate;

                    // Save/update utility reading record
                    $existingReading = UtilityReading::where('contract_id', $contract->id)
                        ->where('utility_setting_id', $setting->id)
                        ->where('period_month', $month)
                        ->where('period_year', $year)
                        ->first();

                    if ($existingReading) {
                        $existingReading->update([
                            'reading_start' => $readingData['reading_start'],
                            'reading_end' => $readingData['reading_end'],
                            'usage_amount' => $usage,
                            'amount' => $amount,
                        ]);
                    } else {
                        UtilityReading::create([
                            'room_id' => $contract->room_id,
                            'property_id' => $contract->property_id,
                            'utility_setting_id' => $setting->id,
                            'contract_id' => $contract->id,
                            'period_month' => $month,
                            'period_year' => $year,
                            'reading_start' => $readingData['reading_start'],
                            'reading_end' => $readingData['reading_end'],
                            'usage_amount' => $usage,
                            'amount' => $amount,
                            'input_by' => null,
                            'input_at' => now(),
                        ]);
                    }

                    // Add invoice item for this utility
                    $descParts = $setting->name . ' (' . $usage . ' ' . $setting->unit;
                    if ($setting->min_usage > 0) {
                        $descParts .= ' - subsidi ' . $setting->min_usage . ' ' . $setting->unit;
                    }
                    $descParts .= ' = ' . $billableUsage . ' ' . $setting->unit . ' × ' . number_format($setting->rate, 0, ',', '.') . ')';

                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'type' => $setting->type,
                        'name' => $setting->name,
                        'description' => $descParts,
                        'quantity' => $billableUsage,
                        'unit_price' => $setting->rate,
                        'amount' => $amount,
                        'metadata' => [
                            'reading_start' => $readingData['reading_start'],
                            'reading_end' => $readingData['reading_end'],
                            'usage' => $usage,
                            'subsidy' => (float) $setting->min_usage,
                            'billable_usage' => $billableUsage,
                            'rate' => $setting->rate,
                        ],
                    ]);
                }
            }

            // 3. Add additional charges (biaya tambahan)
            if (!empty($additionalCharges)) {
                foreach ($additionalCharges as $charge) {
                    if (empty($charge['description']) || empty($charge['amount'])) continue;

                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'type' => 'other',
                        'name' => $charge['description'],
                        'description' => $charge['description'],
                        'quantity' => 1,
                        'unit_price' => $charge['amount'],
                        'amount' => $charge['amount'],
                    ]);
                }
            }

            // 4. Calculate totals
            $this->recalculateInvoice($invoice);

            return $invoice;
        });
    }

    private function addRentItem(Invoice $invoice, Contract $contract): void
    {
        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'type' => 'rent',
            'name' => 'Sewa Kamar',
            'description' => 'Sewa kamar bulan ' . $invoice->period_month . '/' . $invoice->period_year,
            'quantity' => 1,
            'unit_price' => $contract->monthly_price,
            'amount' => $contract->monthly_price,
        ]);
    }

    private function addUtilityItems(Invoice $invoice, Contract $contract, int $month, int $year): void
    {
        $readings = UtilityReading::where('contract_id', $contract->id)
            ->where('period_month', $month)
            ->where('period_year', $year)
            ->with('utilitySetting')
            ->get();

        foreach ($readings as $reading) {
            if ($reading->reading_end !== null && $reading->usage_amount === null) {
                $reading->calculateUsage();
                $reading->save();
            }

            $usage = $reading->usage_amount ?? 0;
            $minUsage = (float) $reading->utilitySetting->min_usage;
            $billableUsage = max(0, $usage - $minUsage);
            $amount = $billableUsage * $reading->utilitySetting->rate;

            $descParts = $reading->utilitySetting->name . ' (' . $usage . ' ' . $reading->utilitySetting->unit;
            if ($minUsage > 0) {
                $descParts .= ' - subsidi ' . $minUsage . ' ' . $reading->utilitySetting->unit;
            }
            $descParts .= ' = ' . $billableUsage . ' ' . $reading->utilitySetting->unit . ')';

            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'type' => $reading->utilitySetting->type,
                'name' => $reading->utilitySetting->name,
                'description' => $descParts,
                'quantity' => $billableUsage,
                'unit_price' => $reading->utilitySetting->rate,
                'amount' => $amount,
                'metadata' => [
                    'reading_start' => $reading->reading_start,
                    'reading_end' => $reading->reading_end,
                    'usage' => $usage,
                    'subsidy' => $minUsage,
                    'billable_usage' => $billableUsage,
                    'rate' => $reading->utilitySetting->rate,
                ],
            ]);
        }
    }

    public function recalculateInvoice(Invoice $invoice): void
    {
        $subtotal = $invoice->items()->sum('amount');
        $totalAmount = $subtotal - $invoice->discount;

        $invoice->update([
            'subtotal' => $subtotal,
            'total_amount' => max(0, $totalAmount),
        ]);
    }
}
