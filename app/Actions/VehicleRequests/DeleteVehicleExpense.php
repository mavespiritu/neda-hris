<?php

namespace App\Actions\VehicleRequests;

use Illuminate\Support\Facades\DB;
use App\Traits\AuthorizesVehicleRequests;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class DeleteVehicleExpense
{
    use AsAction, AuthorizesVehicleRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return $this->canReviewVehicleRequest($request->user(), $id);
    }

    public function handle(int $travelOrderId, int $expenseId): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $travelOrderId, $expenseId) {
            // Lock target row
            $expense = $conn2->table('travel_order_service_expenses')
                ->where('id', $expenseId)
                ->where('travel_order_id', $travelOrderId)
                ->lockForUpdate()
                ->first();

            if (! $expense) {
                throw new RuntimeException('Service expense item not found.');
            }

            $conn2->table('travel_order_service_expenses')
                ->where('id', $expenseId)
                ->where('travel_order_id', $travelOrderId)
                ->delete();
        });
    }

    public function asController(ActionRequest $request)
    {
        $travelOrderId = (int) $request->route('id');
        $expenseId = (int) $request->route('expenseId');

        try {
            $this->handle(
                travelOrderId: $travelOrderId,
                expenseId: $expenseId
            );

            return back()->with([
                'status' => 'success',
                'title' => 'Deleted',
                'message' => 'Service vehicle expense item deleted.',
            ]);
        } catch (RuntimeException $e) {
            // Your UI onError(errors) reads this key
            return back()->withErrors([
                'service_expense' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            Log::error("DeleteVehicleExpense failed [TO:{$travelOrderId} EXP:{$expenseId}] {$e->getMessage()}");

            return back()->withErrors([
                'service_expense' => 'Unable to delete this item. Please try again.',
            ]);
        }
    }
}


