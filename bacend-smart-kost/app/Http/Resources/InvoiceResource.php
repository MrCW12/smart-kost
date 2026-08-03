<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'room_id' => $this->room_id,
            'property_id' => $this->property_id,
            'contract_id' => $this->contract_id,
            'invoice_number' => $this->invoice_number,
            'period_month' => $this->period_month,
            'period_year' => $this->period_year,
            'due_date' => $this->due_date->format('Y-m-d'),
            'subtotal' => $this->subtotal,
            'discount' => $this->discount,
            'total_amount' => $this->total_amount,
            'remaining_amount' => $this->remaining_amount,
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'status_color' => $this->status->color(),
            'notes' => $this->notes,
            'paid_at' => $this->paid_at?->format('Y-m-d H:i:s'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'id' => $this->tenant->id,
                'name' => $this->tenant->name,
                'phone' => $this->tenant->phone,
            ]),
            'room' => $this->whenLoaded('room', fn () => [
                'id' => $this->room->id,
                'number' => $this->room->number,
            ]),
            'property' => $this->whenLoaded('property', fn () => [
                'id' => $this->property->id,
                'name' => $this->property->name,
            ]),
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(fn ($item) => [
                    'id' => $item->id,
                    'type' => $item->type,
                    'name' => $item->name,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'amount' => $item->amount,
                    'metadata' => $item->metadata,
                ]);
            }),
            'payments' => $this->whenLoaded('payments', function () {
                return $this->payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'payment_method' => $payment->payment_method,
                    'payment_date' => $payment->payment_date,
                    'status' => $payment->status,
                ]);
            }),
        ];
    }
}
