<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    use \App\Traits\ScopedByProperty;

    public function index(Request $request): JsonResponse
    {
        $query = Contract::with(['tenant', 'room', 'property']);

        // Scope by owner/admin/staff properties
        $propertyIds = $this->getUserPropertyIds($request);
        $query->whereIn('property_id', $propertyIds);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('contract_number', 'like', "%{$request->search}%")
                  ->orWhereHas('tenant', function ($tq) use ($request) {
                      $tq->where('name', 'like', "%{$request->search}%");
                  });
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        $contracts = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            ContractResource::collection($contracts),
            [
                'current_page' => $contracts->currentPage(),
                'last_page' => $contracts->lastPage(),
                'per_page' => $contracts->perPage(),
                'total' => $contracts->total(),
            ]
        );
    }

    public function show(Contract $contract): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!in_array($contract->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        return $this->success(
            new ContractResource($contract->load(['tenant', 'room', 'property']))
        );
    }

    public function update(Request $request, Contract $contract): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($contract->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        if (!$contract->isActive()) {
            return $this->error('Contract is not active', 422);
        }

        $request->validate([
            'monthly_price' => 'sometimes|numeric|min:0',
            'payment_day' => 'sometimes|integer|between:1,28',
            'end_date' => 'nullable|date|after:start_date',
            'notes' => 'nullable|string',
        ]);

        $contract->update($request->only(['monthly_price', 'payment_day', 'end_date', 'notes']));

        return $this->success(
            new ContractResource($contract->fresh()->load(['tenant', 'room', 'property'])),
            'Contract updated successfully'
        );
    }
}
