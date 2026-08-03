<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Property;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    use \App\Traits\ScopedByProperty;

    public function index(Request $request): JsonResponse
    {
        $query = Expense::with(['expenseCategory', 'creator']);

        // Scope by owner/admin/staff properties
        $propertyIds = $this->getUserPropertyIds($request);
        $query->whereIn('property_id', $propertyIds);

        if ($request->property_id) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->expense_category_id) {
            $query->where('expense_category_id', $request->expense_category_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('expense_date', [$request->start_date, $request->end_date]);
        }

        $expenses = $query->latest()->paginate($request->get('per_page', 15));

        return $this->successWithMeta(
            $expenses->map(fn ($e) => [
                'id' => $e->id,
                'title' => $e->title,
                'description' => $e->description,
                'amount' => $e->amount,
                'expense_date' => $e->expense_date->format('Y-m-d'),
                'payment_method' => $e->payment_method,
                'receipt' => $e->receipt,
                'category' => $e->expenseCategory?->name,
                'created_by' => $e->creator?->name,
                'created_at' => $e->created_at,
            ]),
            [
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
                'per_page' => $expenses->perPage(),
                'total' => $expenses->total(),
            ]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'property_id' => 'required|exists:properties,id',
            'expense_category_id' => 'nullable|exists:expense_categories,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'receipt' => 'nullable|string|max:500',
            'payment_method' => 'required|string|in:cash,bank_transfer,ewallet,other',
        ]);

        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array((int) $request->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $expense = Expense::create([
            ...$request->only([
                'property_id', 'expense_category_id', 'title', 'description',
                'amount', 'expense_date', 'receipt', 'payment_method',
            ]),
            'created_by' => $request->user()->id,
        ]);

        return $this->success(
            $expense->load(['expenseCategory', 'creator']),
            'Expense created successfully',
            201
        );
    }

    public function show(Expense $expense): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!in_array($expense->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        return $this->success(
            $expense->load(['expenseCategory', 'creator', 'property'])
        );
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds($request);
        if (!in_array($expense->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'sometimes|numeric|min:0',
            'expense_date' => 'sometimes|date',
            'expense_category_id' => 'nullable|exists:expense_categories,id',
            'receipt' => 'nullable|string|max:500',
            'payment_method' => 'sometimes|string|in:cash,bank_transfer,ewallet,other',
        ]);

        $expense->update($request->only([
            'title', 'description', 'amount', 'expense_date',
            'expense_category_id', 'receipt', 'payment_method',
        ]));

        return $this->success(
            $expense->fresh()->load(['expenseCategory', 'creator']),
            'Expense updated successfully'
        );
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $propertyIds = $this->getUserPropertyIds(request());
        if (!in_array($expense->property_id, $propertyIds)) {
            return $this->error('Unauthorized', 403);
        }

        $expense->delete();

        return $this->success(null, 'Expense deleted successfully');
    }

    public function categories(Request $request, Property $property): JsonResponse
    {
        if (!$this->authorizePropertyAccess($request, $property->id)) {
            return $this->error('Unauthorized', 403);
        }

        $categories = $property->expenseCategories()->where('is_active', true)->get();

        return $this->success($categories);
    }
}
