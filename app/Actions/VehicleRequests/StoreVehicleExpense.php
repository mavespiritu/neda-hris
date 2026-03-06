<?php

namespace App\Actions\VehicleRequests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class StoreVehicleExpense
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('vr.review', $id);
    }

    public function rules(): array
    {
        return [
            'driver' => ['required'],
            'vehicle_id' => ['required', 'integer'],
            'total_km' => ['required', 'numeric', 'min:0'],
            'gas_price' => ['required', 'numeric', 'min:0'],
            'toll_fee' => ['nullable', 'numeric', 'min:0'],
            'tev' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'driver.required' => 'Please select a driver.',
            'vehicle_id.required' => 'Please select a vehicle.',
            'vehicle_id.integer' => 'Selected vehicle is invalid.',
            'total_km.required' => 'Total kilometers is required.',
            'total_km.numeric' => 'Total kilometers must be a valid number.',
            'total_km.min' => 'Total kilometers must be 0 or greater.',
            'gas_price.required' => 'Gas price is required.',
            'gas_price.numeric' => 'Gas price must be a valid number.',
            'gas_price.min' => 'Gas price must be 0 or greater.',
            'toll_fee.numeric' => 'Toll fee must be a valid number.',
            'toll_fee.min' => 'Toll fee must be 0 or greater.',
            'tev.numeric' => 'TEV must be a valid number.',
            'tev.min' => 'TEV must be 0 or greater.',
        ];
    }

    public function handle(int $travelOrderId, array $data, string $actorIpmsId): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $travelOrderId, $data, $actorIpmsId) {
            $vehicle = $conn2->table('travel_order_vehicles')
                ->select(['id', 'avg_consumption'])
                ->where('id', (int) $data['vehicle_id'])
                ->lockForUpdate()
                ->first();

            if (! $vehicle || ! $vehicle->avg_consumption || (float) $vehicle->avg_consumption <= 0) {
                throw new RuntimeException('Invalid vehicle / avg consumption.');
            }

            $totalGas = ((float) $data['total_km'] * 2) / (float) $vehicle->avg_consumption;

            $payload = [
                'travel_order_id' => $travelOrderId,
                'driver' => (string) $data['driver'],
                'vehicle_id' => (int) $data['vehicle_id'],
                'total_km' => (float) $data['total_km'],
                'total_gas' => (float) $totalGas,
                'gas_price' => (float) $data['gas_price'],
                'toll_fee' => (float) ($data['toll_fee'] ?? 0),
                'tev' => (float) ($data['tev'] ?? 0),
                'avg_consumption' => (float) ($vehicle->avg_consumption ?? 0),
                'created_by' => $actorIpmsId,
            ];

            if ($this->tableHasTimestamps($conn2, 'travel_order_service_expenses')) {
                $payload['created_at'] = now();
                $payload['updated_at'] = now();
            }

            $conn2->table('travel_order_service_expenses')->insert($payload);
        });
    }

    public function asController(ActionRequest $request)
    {
        $travelOrderId = (int) ($request->route('id') ?? $request->route('travel_request'));

        try {
            $this->handle(
                travelOrderId: $travelOrderId,
                data: $request->validated(),
                actorIpmsId: (string) $request->user()->ipms_id
            );

            return back()->with([
                'status' => 'success',
                'title' => 'Saved',
                'message' => 'Service vehicle expense item added.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['service_expense' => $e->getMessage()])->withInput();
        } catch (\Throwable $e) {
            Log::error("StoreVehicleExpense failed [TO:{$travelOrderId}] {$e->getMessage()}");

            return back()->withErrors([
                'service_expense' => 'Failed to save service vehicle expense.',
            ])->withInput();
        }
    }

    private function tableHasTimestamps($conn, string $table): bool
    {
        try {
            $cols = $conn->getSchemaBuilder()->getColumnListing($table);
            return in_array('created_at', $cols, true) && in_array('updated_at', $cols, true);
        } catch (\Throwable) {
            return false;
        }
    }
}
