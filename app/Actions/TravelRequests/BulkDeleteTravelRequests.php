<?php

namespace App\Actions\TravelRequests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class BulkDeleteTravelRequests
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        return true; // per-id authorization checked in handle()
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ];
    }

    public function handle(array $ids, $user): array
    {
        $conn2 = DB::connection('mysql2');

        $ids = collect($ids)->map(fn ($v) => (int) $v)->unique()->values();

        if ($ids->isEmpty()) {
            throw new RuntimeException('No travel request IDs provided.');
        }

        $denied = $ids->filter(fn ($id) => ! Gate::forUser($user)->allows('tr.delete', $id))->values();
        if ($denied->isNotEmpty()) {
            throw new RuntimeException('You are not allowed to delete one or more selected requests.');
        }

        $conn2->transaction(function () use ($conn2, $ids) {
            $conn2->table('travel_order_review')->whereIn('travel_order_id', $ids)->delete();
            $conn2->table('travel_order_service_expenses')->whereIn('travel_order_id', $ids)->delete();
            $conn2->table('travel_order_expenses')->whereIn('travel_order_id', $ids)->delete();
            $conn2->table('travel_order_destinations')->whereIn('travel_order_id', $ids)->delete();
            $conn2->table('travel_order_staffs')->whereIn('travel_order_id', $ids)->delete();
            $conn2->table('submission_history')->whereIn('model_id', $ids)->delete();
            $conn2->table('travel_order')->whereIn('id', $ids)->delete();
        });

        return ['count' => $ids->count()];
    }

    public function asController(ActionRequest $request)
    {
        try {
            $result = $this->handle($request->validated('ids'), $request->user());

            return back()->with([
                'status' => 'success',
                'title' => 'Deleted',
                'message' => "{$result['count']} travel request(s) deleted successfully.",
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['travel_request' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("BulkDeleteTravelRequests failed {$e->getMessage()}");
            return back()->withErrors(['travel_request' => 'Failed to bulk delete travel requests.']);
        }
    }
}
