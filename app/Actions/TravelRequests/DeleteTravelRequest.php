<?php

namespace App\Actions\TravelRequests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class DeleteTravelRequest
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('tr.delete', $id);
    }

    public function rules(): array
    {
        return [];
    }

    public function handle(int $id): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $id) {
            $exists = $conn2->table('travel_order')->where('id', $id)->exists();
            if (! $exists) {
                throw new RuntimeException('Travel request not found.');
            }

            // delete children first
            $conn2->table('travel_order_review')->where('travel_order_id', $id)->delete();
            $conn2->table('travel_order_service_expenses')->where('travel_order_id', $id)->delete();
            $conn2->table('travel_order_expenses')->where('travel_order_id', $id)->delete();
            $conn2->table('travel_order_destinations')->where('travel_order_id', $id)->delete();
            $conn2->table('travel_order_staffs')->where('travel_order_id', $id)->delete();

            $conn2->table('submission_history')->where('model_id', $id)->delete();

            $conn2->table('travel_order')->where('id', $id)->delete();
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle($id);

            return redirect()->route('travel-requests.index')->with([
                'status' => 'success',
                'title' => 'Deleted',
                'message' => 'Travel request deleted successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['travel_request' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("DeleteTravelRequest failed [TO:{$id}] {$e->getMessage()}");
            return back()->withErrors(['travel_request' => 'Failed to delete travel request.']);
        }
    }
}
