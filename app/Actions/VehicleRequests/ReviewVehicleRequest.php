<?php

namespace App\Actions\VehicleRequests;

use App\Models\VehicleRequest;
use App\States\VehicleRequest\Endorsed as VrEndorsed;
use App\States\VehicleRequest\Reviewed as VrReviewed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class ReviewVehicleRequest
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
            'recommendation' => ['required', Rule::in(['Approved', 'Disapproved'])],
            'prioritization_id' => [
                Rule::requiredIf(fn () => request()->input('recommendation') === 'Approved'),
                'nullable',
                'integer',
            ],
            'remarks' => [
                Rule::requiredIf(fn () => request()->input('recommendation') === 'Disapproved'),
                'nullable',
                'string',
            ],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'recommendation.required' => 'Recommendation is required.',
            'recommendation.in' => 'Recommendation must be Approved or Disapproved.',
            'prioritization_id.required' => 'Reason is required when recommendation is Approved.',
            'remarks.required' => 'Remarks are required when recommendation is Disapproved.',
        ];
    }

    public function handle(int $id, array $data, string $reviewerId): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $id, $data, $reviewerId) {
            $travelOrder = $conn2->table('travel_order')
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $travelOrder) {
                throw new RuntimeException('Vehicle request not found.');
            }

            $vehicleRequest = VehicleRequest::on('mysql2')
                ->whereKey($id)
                ->lockForUpdate()
                ->first();

            if (! $vehicleRequest) {
                throw new RuntimeException('Vehicle request model not found.');
            }

            if (! ($vehicleRequest->state instanceof VrEndorsed)) {
                throw new RuntimeException('Only endorsed requests can be reviewed.');
            }

            $reason = null;
            if (($data['recommendation'] ?? null) === 'Approved' && ! empty($data['prioritization_id'])) {
                $reason = $conn2->table('travel_order_prioritizations')
                    ->where('id', (int) $data['prioritization_id'])
                    ->value('reason');
            }

            $payload = [
                'travel_order_id' => $id,
                'recommendation' => $data['recommendation'],
                'dispatcher' => $reviewerId,
                'prioritization_id' => $data['recommendation'] === 'Approved'
                    ? (int) ($data['prioritization_id'] ?? 0)
                    : null,
                'reason' => $data['recommendation'] === 'Approved' ? ($reason ?? null) : null,
                'remarks' => $data['remarks'] ?? null,
            ];

            $existing = $conn2->table('travel_order_review')
                ->where('travel_order_id', $id)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                $payload['updated_by'] = $reviewerId;
                $payload['updated_at'] = now();

                $conn2->table('travel_order_review')
                    ->where('id', (int) $existing->id)
                    ->update($payload);
            } else {
                $payload['created_by'] = $reviewerId;
                $payload['created_at'] = now();

                $conn2->table('travel_order_review')->insert($payload);
            }

            $vehicleRequest->state->transitionTo(
                VrReviewed::class,
                $reviewerId,
                $data['remarks'] ?? null,
                true
            );
            $vehicleRequest->refresh();
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle(
                id: $id,
                data: $request->validated(),
                reviewerId: (string) $request->user()->ipms_id
            );

            return back()->with([
                'status' => 'success',
                'title' => 'Submitted',
                'message' => 'PRU assessment submitted.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['review' => $e->getMessage()])->withInput();
        } catch (\Throwable $e) {
            Log::error("Error reviewing vehicle request #{$id}: {$e->getMessage()}");

            return back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while reviewing vehicle request. Please try again.',
            ])->withInput();
        }
    }
}
