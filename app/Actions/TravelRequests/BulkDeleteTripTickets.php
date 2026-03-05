<?php

namespace App\Actions\TravelRequests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class BulkDeleteTripTickets
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $ids = collect((array) $request->input('ids', []))
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return false;
        }

        $travelOrderIds = DB::connection('mysql2')
            ->table('trip_tickets')
            ->whereIn('id', $ids->all())
            ->pluck('travel_order_id')
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($travelOrderIds->isEmpty()) {
            return false;
        }

        $gate = Gate::forUser($request->user());

        foreach ($travelOrderIds as $travelOrderId) {
            if (! $gate->allows('tt.deleteByVehicleRequest', $travelOrderId)) {
                return false;
            }
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'ids.required' => 'Please select at least one trip ticket.',
            'ids.array' => 'Invalid trip ticket list.',
            'ids.min' => 'Please select at least one trip ticket.',
            'ids.*.integer' => 'Invalid trip ticket id.',
            'ids.*.distinct' => 'Duplicate trip ticket id found.',
        ];
    }

    public function handle(array $tripTicketIds): int
    {
        $ids = collect($tripTicketIds)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            throw new RuntimeException('No trip tickets selected.');
        }

        $conn2 = DB::connection('mysql2');

        return $conn2->transaction(function () use ($conn2, $ids) {
            $existingIds = $conn2->table('trip_tickets')
                ->whereIn('id', $ids->all())
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->values();

            if ($existingIds->count() !== $ids->count()) {
                throw new RuntimeException('Some trip tickets were not found.');
            }

            return (int) $conn2->table('trip_tickets')
                ->whereIn('id', $ids->all())
                ->delete();
        });
    }

    public function asController(ActionRequest $request)
    {
        $validated = $request->validated();

        try {
            $deleted = $this->handle($validated['ids']);

            return back()->with([
                'status' => 'success',
                'title' => 'Deleted',
                'message' => "{$deleted} trip ticket(s) deleted successfully.",
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['trip_ticket' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("BulkDeleteTripTickets failed: {$e->getMessage()}");

            return back()->withErrors([
                'trip_ticket' => 'Failed to delete selected trip tickets.',
            ]);
        }
    }
}
