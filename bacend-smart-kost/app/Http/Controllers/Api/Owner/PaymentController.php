<?php

namespace App\Http\Controllers\Api\Owner;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use \App\Traits\ScopedByProperty;

    public function __construct(
        private PaymentService $paymentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['invoice', 'tenant', 'property']);

        // Scope by owner/admin/staff properties
        $propertyIds = $this->getUserPropertyIds($request);
        $query->whereIn('property_id', $propertyIds);

        if ($request->invoice_id) {
            $query->where('invoice_id', $request->invoice_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->payment_method) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('payment_number', 'like', "%{$request->search}%")
                  ->orWhereHas('invoice', function ($iq) use ($request) {
                      $iq->where('invoice_number', 'like', "%{$request->search}%");
                  });
            });
        }

        $payments = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            $payments->map(fn ($p) => [
                'id' => $p->id,
                'payment_number' => $p->payment_number,
                'amount' => $p->amount,
                'payment_method' => $p->payment_method,
                'payment_date' => $p->payment_date->format('Y-m-d'),
                'status' => $p->status,
                'status_label' => $p->status->label(),
                'status_color' => $p->status->color(),
                'invoice_id' => $p->invoice_id,
                'invoice_number' => $p->invoice?->invoice_number,
                'tenant_name' => $p->tenant?->name,
                'notes' => $p->notes,
                'created_at' => $p->created_at,
            ]),
            [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:cash,bank_transfer,ewallet,other',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'reference_number' => 'nullable|string|max:100',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
            'proof' => 'nullable|string|max:500',
            'confirm' => 'nullable|boolean',
        ]);

        $invoice = Invoice::findOrFail($request->invoice_id);

        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($invoice->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $shouldConfirm = $request->boolean('confirm', false);

        $payment = Payment::create([
            'invoice_id' => $request->invoice_id,
            'tenant_id' => $invoice->tenant_id,
            'property_id' => $invoice->property_id,
            'payment_number' => Payment::generatePaymentNumber(),
            'amount' => $request->amount,
            'payment_method' => $request->payment_method,
            'bank_name' => $request->bank_name,
            'bank_account_number' => $request->bank_account_number,
            'reference_number' => $request->reference_number,
            'payment_date' => $request->payment_date,
            'notes' => $request->notes,
            'proof' => $request->proof,
            'status' => $shouldConfirm ? \App\Enums\PaymentStatus::CONFIRMED : \App\Enums\PaymentStatus::PENDING,
            'confirmed_by' => $shouldConfirm ? $request->user()->id : null,
            'confirmed_at' => $shouldConfirm ? now() : null,
        ]);

        if ($shouldConfirm) {
            $this->paymentService->confirmPayment($payment, $request->user()->id);
        } else {
            $invoice->update(['status' => InvoiceStatus::PENDING]);
            $this->paymentService->notifyPaymentSubmitted($payment);
        }

        return $this->success(
            $payment->load(['invoice', 'tenant']),
            'Payment created successfully',
            201
        );
    }

    public function show(Payment $payment): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!in_array($payment->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        return $this->success(
            $payment->load(['invoice', 'tenant', 'property', 'confirmedByUser'])
        );
    }

    public function confirm(Request $request, Payment $payment): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($payment->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        if ($payment->status->value !== 'pending') {
            return $this->error('Payment is not pending', 422);
        }

        $request->validate([
            'payment_method' => 'nullable|string|in:cash,bank_transfer,ewallet,other',
        ]);

        if ($request->payment_method) {
            $payment->update(['payment_method' => $request->payment_method]);
        }

        $this->paymentService->confirmPayment($payment, $request->user()->id);

        return $this->success(
            $payment->fresh()->load(['invoice', 'tenant']),
            'Payment confirmed successfully'
        );
    }

    public function reject(Request $request, Payment $payment): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($payment->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        if ($payment->status->value !== 'pending') {
            return $this->error('Payment is not pending', 422);
        }

        $this->paymentService->rejectPayment($payment, $request->user()->id);

        return $this->success(
            $payment->fresh()->load(['invoice', 'tenant']),
            'Payment rejected'
        );
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!in_array($payment->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        if ($payment->status->value !== 'pending') {
            return $this->error('Hanya pembayaran pending yang bisa dihapus', 422);
        }

        $invoice = $payment->invoice;
        $payment->delete();

        $hasOtherPending = $invoice->payments()
            ->where('status', \App\Enums\PaymentStatus::PENDING)
            ->exists();

        if (!$hasOtherPending) {
            $invoice->update(['status' => InvoiceStatus::UNPAID]);
        }

        return $this->success(null, 'Pembayaran berhasil dihapus');
    }
}
