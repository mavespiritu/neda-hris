<?php

namespace App\Actions\TravelRequests;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Traits\AuthorizesTravelRequests;
use App\Models\TravelRequest;
use App\States\TravelRequest\Draft;

class StoreTravelRequest
{
    use AsAction, AuthorizesTravelRequests;

    public function authorize(ActionRequest $request): bool
    {
        return $this->canCreateTravelRequest($request->user());
    }

    public function rules(): array
    {
        return [
            'reference_no' => ['required', 'string'],
            'travel_category_id' => ['required', 'integer'],
            'travel_type' => ['required'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'purpose' => ['required', 'string'],
            'fund_source_id' => ['required'],

            'staffs' => ['required', 'array', 'min:1'],
            'staffs.*' => ['required'],

            'destinations' => ['required', 'array', 'min:1'],
            'destinations.*.type' => ['nullable', 'string'],
            'destinations.*.location' => ['required', 'string'],
            'destinations.*.country' => ['nullable', 'string'],
            'destinations.*.province' => ['nullable', 'string'],
            'destinations.*.provinceName' => ['nullable', 'string'],
            'destinations.*.isMetroManila' => ['nullable'],
            'destinations.*.district' => ['nullable', 'string'],
            'destinations.*.districtName' => ['nullable', 'string'],
            'destinations.*.citymun' => ['nullable', 'string'],
            'destinations.*.citymunName' => ['nullable', 'string'],

            'other_passengers' => ['nullable', 'string'],
            'other_vehicles' => ['nullable', 'string'],
            'other_drivers' => ['nullable', 'string'],

            'isRequestingVehicle' => ['nullable'],
            'est_distance' => ['nullable', 'numeric', 'min:0.01'],
            'est_departure_time' => ['nullable', 'string'],
            'est_arrival_time' => ['nullable', 'string'],

            'commutation_expenses' => ['nullable', 'array'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'staffs.required' => 'Please select at least one authorized personnel.',
            'staffs.min' => 'Please select at least one authorized personnel.',
            'destinations.required' => 'Please add at least one destination.',
            'destinations.min' => 'Please add at least one destination.',
            'travel_category_id.required' => 'The travel category field is required.',
            'fund_source_id.required' => 'The fund source field is required.',
        ];
    }
    
    public function withValidator($validator, ActionRequest $request): void
    {
        $validator->after(function ($v) use ($request) {
            $needsVehicle = $this->needsVehicle($request->input('isRequestingVehicle'));

            foreach (($request->input('destinations', []) ?? []) as $i => $dest) {
                $type = $dest['type'] ?? null;

                if ($type === 'Local') {
                    $isMetro = filter_var($dest['isMetroManila'] ?? null, FILTER_VALIDATE_BOOLEAN) === true;

                    if ($isMetro) {
                        if (empty($dest['district'])) {
                            $v->errors()->add("destinations.$i.district", 'District is required for Metro Manila destinations.');
                        }
                        if (empty($dest['citymun'])) {
                            $v->errors()->add("destinations.$i.citymun", 'City/Municipality is required for Metro Manila destinations.');
                        }
                    } else {
                        if (empty($dest['province'])) {
                            $v->errors()->add("destinations.$i.province", 'Province is required for local destinations.');
                        }
                        if (empty($dest['citymun'])) {
                            $v->errors()->add("destinations.$i.citymun", 'City/Municipality is required for local destinations.');
                        }
                    }
                }

                if ($type === 'International' && empty($dest['country'])) {
                    $v->errors()->add("destinations.$i.country", 'Country is required for international destinations.');
                }
            }

            if (!$needsVehicle) return;

            $dist = $request->input('est_distance');
            $dep = $request->input('est_departure_time');
            $arr = $request->input('est_arrival_time');

            if ($dist === null || $dist === '' || !is_numeric($dist) || (float) $dist <= 0) {
                $v->errors()->add('est_distance', 'Estimated distance is required and must be greater than 0.');
            }
            if ($dep === null || trim((string) $dep) === '') {
                $v->errors()->add('est_departure_time', 'Estimated departure time is required.');
            }
            if ($arr === null || trim((string) $arr) === '') {
                $v->errors()->add('est_arrival_time', 'Estimated arrival time is required.');
            }

            $comm = $request->input('commutation_expenses');
            if (!is_array($comm) || count($comm) < 1) {
                $v->errors()->add('commutation_expenses', 'Please add at least one commutation expense entry.');
                return;
            }

            foreach ($comm as $i => $row) {
                $particulars = is_array($row) ? ($row['particulars'] ?? null) : null;
                $amount = is_array($row) ? ($row['amount'] ?? null) : null;

                if ($particulars === null || trim((string) $particulars) === '') {
                    $v->errors()->add("commutation_expenses.$i.particulars", 'Particulars is required.');
                }

                if (is_string($amount)) {
                    $amount = str_replace([',', '₱', ' '], '', $amount);
                }

                if ($amount === null || $amount === '' || !is_numeric($amount) || (float) $amount <= 0) {
                    $v->errors()->add("commutation_expenses.$i.amount", 'Amount is required and must be a number greater than 0.');
                }
            }
        });
    }

    public function handle(array $data, string $actorIpmsId, ?string $division): int
    {
        $conn2 = DB::connection('mysql2');
        $needsVehicle = $this->needsVehicle($data['isRequestingVehicle'] ?? false);
        $commutation = $this->normalizeCommutation($data['commutation_expenses'] ?? [], $needsVehicle);

        return $conn2->transaction(function () use ($conn2, $data, $needsVehicle, $commutation, $actorIpmsId, $division) {
            $travelOrderId = $conn2->table('travel_order')->insertGetId([
                'reference_no' => $data['reference_no'],
                'request_type' => 'TO',
                'travel_type' => $data['travel_type'],
                'travel_category_id' => $data['travel_category_id'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'purpose' => $data['purpose'],
                'fund_source_id' => $data['fund_source_id'],
                'other_passengers' => $data['other_passengers'] ?? null,
                'other_vehicles' => $data['other_vehicles'] ?? null,
                'other_drivers' => $data['other_drivers'] ?? null,
                'isRequestingVehicle' => $needsVehicle ? 1 : 0,
                'est_distance' => $needsVehicle ? ($data['est_distance'] ?? null) : null,
                'est_departure_time' => $needsVehicle ? ($data['est_departure_time'] ?? null) : null,
                'est_arrival_time' => $needsVehicle ? ($data['est_arrival_time'] ?? null) : null,
                'created_by' => $actorIpmsId,
                'date_created' => Carbon::now(),
                'division' => $division,
            ]);

            $staffRows = collect($data['staffs'] ?? [])
                ->map(fn ($staff) => [
                    'travel_order_id' => $travelOrderId,
                    'emp_id' => $staff['emp_id'],
                    'recommender_id' => $staff['recommender_id'] ?? null,
                    'approver_id' => $staff['approver_id'] ?? null,
                ])
                ->values()
                ->all();

            if (!empty($staffRows)) {
                $conn2->table('travel_order_staffs')->insert($staffRows);
            }

            $destinationRows = collect($data['destinations'] ?? [])
                ->map(function ($dest) use ($travelOrderId) {
                    $type = $dest['type'] ?? null;
                    $isMetro = filter_var($dest['isMetroManila'] ?? null, FILTER_VALIDATE_BOOLEAN) === true;

                    $country = $type === 'Local' ? 'Philippines' : ($dest['country'] ?? null);

                    $province = $dest['province'] ?? null;
                    $provinceName = $dest['provinceName'] ?? null;
                    $district = $dest['district'] ?? null;
                    $districtName = $dest['districtName'] ?? null;

                    if ($type === 'Local' && $isMetro) {
                        $province = null;
                        $provinceName = 'Metro Manila';
                    } else {
                        $district = null;
                        $districtName = null;
                    }

                    return [
                        'travel_order_id' => $travelOrderId,
                        'type' => $type,
                        'country' => $country,
                        'province' => $province,
                        'provinceName' => $provinceName,
                        'district' => $district,
                        'districtName' => $districtName,
                        'isMetroManila' => $type === 'Local' ? ($isMetro ? 1 : 0) : 0,
                        'citymun' => $dest['citymun'] ?? null,
                        'citymunName' => $dest['citymunName'] ?? null,
                        'location' => $dest['location'] ?? null,
                    ];
                })
                ->values()
                ->all();

            if (!empty($destinationRows)) {
                $conn2->table('travel_order_destinations')->insert($destinationRows);
            }

            if ($needsVehicle && !empty($commutation)) {
                $expenseRows = collect($commutation)
                    ->map(fn ($comm) => [
                        'travel_order_id' => $travelOrderId,
                        'particulars' => $comm['particulars'],
                        'amount' => $comm['amount'],
                    ])
                    ->values()
                    ->all();

                $conn2->table('travel_order_expenses')->insert($expenseRows);
            }

            $travelRequest = TravelRequest::query()
            ->whereKey($travelOrderId)
            ->lockForUpdate()
            ->first();

            if (! $travelRequest) {
                throw new \RuntimeException('Travel request not found after creation.');
            }

            if (blank($travelRequest->getRawOriginal('tr_state'))) {
                $travelRequest->tr_state = Draft::class;
                $travelRequest->save();

                $travelRequest->state->transitionTo(
                    Draft::class,
                    (string) $actorIpmsId,
                    null,
                    false
                );
            }

            return (int) $travelOrderId;
        });
    }

    public function asController(ActionRequest $request)
    {
        try {
            $id = $this->handle(
                data: $request->validated(),
                actorIpmsId: (string) $request->user()->ipms_id,
                division: $request->user()->division ?? null
            );

            return redirect()->route('travel-requests.show', ['id' => $id])->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Travel request was saved successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error("Failed to save travel request: {$e->getMessage()}");

            return redirect()->back()->withInput()->with([
                'status' => 'error',
                'title' => 'Save travel request failed',
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function needsVehicle($value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === true;
    }

    private function normalizeCommutation(array $rows, bool $enabled): array
    {
        if (!$enabled) return [];

        return collect($rows)->map(function ($row) {
            $amount = $row['amount'] ?? 0;
            if (is_string($amount)) {
                $amount = str_replace([',', '₱', ' '], '', $amount);
            }

            return [
                'particulars' => trim((string) ($row['particulars'] ?? '')),
                'amount' => (float) $amount,
            ];
        })->values()->all();
    }
}
