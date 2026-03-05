<?php

namespace App\Actions\TravelRequests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class DeleteTripTicket
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $tripTicketId = (int) $request->route('id');

        $vehicleRequestId = (int) DB::connection('mysql2')
            ->table('trip_tickets')
            ->where('id', $tripTicketId)
            ->value('travel_order_id');

        if (! $vehicleRequestId) {
            return false;
        }

        return Gate::forUser($request->user())->allows('tt.deleteByVehicleRequest', $vehicleRequestId);
    }

    public function rules(): array
    {
        return [];
    }

    public function handle(int $tripTicketId): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $tripTicketId) {
            $ticket = $conn2->table('trip_tickets')
                ->where('id', $tripTicketId)
                ->first();

            if (! $ticket) {
                throw new RuntimeException('Trip ticket not found.');
            }

            $conn2->table('trip_tickets')
                ->where('id', $tripTicketId)
                ->delete();
        });
    }

    public function asController(ActionRequest $request)
    {
        $tripTicketId = (int) $request->route('id');

        try {
            $this->handle($tripTicketId);

            return back()->with([
                'status' => 'success',
                'title' => 'Deleted',
                'message' => 'Trip ticket deleted successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['trip_ticket' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("DeleteTripTicket failed [TT:{$tripTicketId}] {$e->getMessage()}");

            return back()->withErrors([
                'trip_ticket' => 'Failed to delete trip ticket.',
            ]);
        }
    }
}
