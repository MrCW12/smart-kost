<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Enums\RoomStatus;
use App\Models\AppNotification;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    public function confirmPayment(Payment $payment, int $confirmedBy): void
    {
        DB::transaction(function () use ($payment, $confirmedBy) {
            $payment->update([
                'status' => PaymentStatus::CONFIRMED,
                'confirmed_by' => $confirmedBy,
                'confirmed_at' => now(),
            ]);

            $this->recalculateInvoiceStatus($payment->invoice);
            $this->notifyPaymentConfirmed($payment);
        });
    }

    public function rejectPayment(Payment $payment, int $confirmedBy): void
    {
        $payment->update([
            'status' => PaymentStatus::REJECTED,
            'confirmed_by' => $confirmedBy,
            'confirmed_at' => now(),
        ]);

        $invoice = $payment->invoice;
        $hasOtherPending = $invoice->payments()
            ->where('status', PaymentStatus::PENDING)
            ->where('id', '!=', $payment->id)
            ->exists();

        if (!$hasOtherPending) {
            $invoice->update(['status' => InvoiceStatus::UNPAID]);
        }

        $this->notifyPaymentRejected($payment);
    }

    public function notifyPaymentSubmitted(Payment $payment): void
    {
        $property = $payment->property;
        if (!$property) {
            return;
        }

        $recipientIds = [];

        $ownerUserId = $property->owner?->user_id;
        if ($ownerUserId) {
            $recipientIds[] = $ownerUserId;
        }

        $adminIds = User::where('owner_id', $property->owner_id)
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->pluck('id')
            ->toArray();
        $recipientIds = array_merge($recipientIds, $adminIds);

        $staffIds = User::where('owner_id', $property->owner_id)
            ->whereHas('roles', fn ($q) => $q->where('name', 'staff'))
            ->pluck('id')
            ->toArray();
        $recipientIds = array_merge($recipientIds, $staffIds);

        $developerIds = User::whereHas('roles', fn ($q) => $q->where('name', 'developer'))
            ->pluck('id')
            ->toArray();
        $recipientIds = array_merge($recipientIds, $developerIds);

        $recipientIds = array_unique($recipientIds);
        if (empty($recipientIds)) {
            return;
        }

        $amount = (float) $payment->amount;
        $tenantName = $payment->tenant?->name ?? 'Tenant';
        $invoiceNumber = $payment->invoice?->invoice_number ?? '';

        foreach ($recipientIds as $userId) {
            AppNotification::create([
                'user_id' => $userId,
                'property_id' => $property->id,
                'type' => 'payment_submitted',
                'title' => 'Pembayaran Baru',
                'message' => $tenantName . ' mengajukan pembayaran ' . number_format($amount, 0, ',', '.')
                    . ($invoiceNumber ? ' (' . $invoiceNumber . ')' : '') . ' — menunggu konfirmasi',
                'data' => [
                    'payment_id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                    'invoice_id' => $payment->invoice_id,
                    'invoice_number' => $invoiceNumber,
                    'amount' => $payment->amount,
                    'tenant_name' => $tenantName,
                ],
            ]);
        }
    }

    private function recalculateInvoiceStatus(Invoice $invoice): void
    {
        $totalPaid = $invoice->payments()
            ->where('status', PaymentStatus::CONFIRMED)
            ->sum('amount');

        if ($totalPaid >= $invoice->total_amount) {
            $invoice->update([
                'status' => InvoiceStatus::PAID,
                'paid_at' => now(),
            ]);
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => InvoiceStatus::PARTIAL]);
        }
    }

    private function notifyPaymentConfirmed(Payment $payment): void
    {
        $property = $payment->property;
        if (!$property) {
            return;
        }

        $recipientIds = [];

        $ownerUserId = $property->owner?->user_id;
        if ($ownerUserId) {
            $recipientIds[] = $ownerUserId;
        }

        $adminIds = User::where('owner_id', $property->owner_id)
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->pluck('id')
            ->toArray();
        $recipientIds = array_merge($recipientIds, $adminIds);

        $staffIds = User::where('owner_id', $property->owner_id)
            ->whereHas('roles', fn ($q) => $q->where('name', 'staff'))
            ->pluck('id')
            ->toArray();
        $recipientIds = array_merge($recipientIds, $staffIds);

        $developerIds = User::whereHas('roles', fn ($q) => $q->where('name', 'developer'))
            ->pluck('id')
            ->toArray();
        $recipientIds = array_merge($recipientIds, $developerIds);

        $recipientIds = array_unique($recipientIds);
        if (empty($recipientIds)) {
            return;
        }

        $amount = (float) $payment->amount;
        $tenantName = $payment->tenant?->name ?? 'Tenant';
        $invoiceNumber = $payment->invoice?->invoice_number ?? '';

        foreach ($recipientIds as $userId) {
            AppNotification::create([
                'user_id' => $userId,
                'property_id' => $property->id,
                'type' => 'payment_confirmed',
                'title' => 'Pembayaran Dikonfirmasi',
                'message' => $tenantName . ' membayar ' . number_format($amount, 0, ',', '.')
                    . ($invoiceNumber ? ' (' . $invoiceNumber . ')' : ''),
                'data' => [
                    'payment_id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                    'invoice_id' => $payment->invoice_id,
                    'invoice_number' => $invoiceNumber,
                    'amount' => $payment->amount,
                    'tenant_name' => $tenantName,
                ],
            ]);
        }
    }

    private function notifyPaymentRejected(Payment $payment): void
    {
        $property = $payment->property;
        if (!$property) {
            return;
        }

        $recipientIds = [];

        $ownerUserId = $property->owner?->user_id;
        if ($ownerUserId) {
            $recipientIds[] = $ownerUserId;
        }

        $adminIds = User::where('owner_id', $property->owner_id)
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->pluck('id')
            ->toArray();
        $recipientIds = array_merge($recipientIds, $adminIds);

        $staffIds = User::where('owner_id', $property->owner_id)
            ->whereHas('roles', fn ($q) => $q->where('name', 'staff'))
            ->pluck('id')
            ->toArray();
        $recipientIds = array_merge($recipientIds, $staffIds);

        $developerIds = User::whereHas('roles', fn ($q) => $q->where('name', 'developer'))
            ->pluck('id')
            ->toArray();
        $recipientIds = array_merge($recipientIds, $developerIds);

        $recipientIds = array_unique($recipientIds);
        if (empty($recipientIds)) {
            return;
        }

        $amount = (float) $payment->amount;
        $tenantName = $payment->tenant?->name ?? 'Tenant';
        $invoiceNumber = $payment->invoice?->invoice_number ?? '';

        foreach ($recipientIds as $userId) {
            AppNotification::create([
                'user_id' => $userId,
                'property_id' => $property->id,
                'type' => 'payment_rejected',
                'title' => 'Pembayaran Ditolak',
                'message' => 'Pembayaran ' . $tenantName . ' sebesar ' . number_format($amount, 0, ',', '.')
                    . ($invoiceNumber ? ' (' . $invoiceNumber . ')' : '') . ' ditolak',
                'data' => [
                    'payment_id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                    'invoice_id' => $payment->invoice_id,
                    'invoice_number' => $invoiceNumber,
                    'amount' => $payment->amount,
                    'tenant_name' => $tenantName,
                ],
            ]);
        }
    }
}
