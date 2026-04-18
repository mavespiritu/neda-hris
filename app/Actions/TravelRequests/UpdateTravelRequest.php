<?php

namespace App\Actions\TravelRequests;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use App\Traits\AuthorizesTravelRequests;
use RuntimeException;

class UpdateTravelRequest
{
    use AsAction, AuthorizesTravelRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return $this->canEditTravelRequest($request->user(), $id);
    }

    public function rules(): array
    {
        return [
            'travel_category_id' => ['required', 'integer'],
            'travel_type' => ['required'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'purpose' => ['required', 'string'],
            'fund_source_id' => ['required'],

            'staffs' => ['required', 'array', 'min:1'],
            'staffs.*' => ['required'],

            'destinations' => ['required', 'array', 'min:1'],
            'destinations.*.id' => ['nullable', 'integer'],
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
            'commutation_expenses.*.id' => ['nullable', 'integer'],
            'commutation_expenses.*.particulars' => ['nullable', 'string'],
            'commutation_expenses.*.amount' => ['nullable'],
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
                        if (empty($dest['district'])) $v->errors()->add("destinations.$i.district", 'District is required for Metro Manila destinations.');
                        if (empty($dest['citymun'])) $v->errors()->add("destinations.$i.citymun", 'City/Municipality is required for Metro Manila destinations.');
                    } else {
                        if (empty($dest['province'])) $v->errors()->add("destinations.$i.province", 'Province is required for local destinations.');
                        if (empty($dest['citymun'])) $v->errors()->add("destinations.$i.citymun", 'City/Municipality is required for local destinations.');
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

                if (is_string($amount)) $amount = str_replace([',', '₱', ' '], '', $amount);
                if ($amount === null || $amount === '' || !is_numeric($amount) || (float) $amount <= 0) {
                    $v->errors()->add("commutation_expenses.$i.amount", 'Amount is required and must be a number greater than 0.');
                }
            }
        });
    }

    public function handle(int $id, array $data, string $actorIpmsId): void
    {
        $conn2 = DB::connection('mysql2');

        $existing = $conn2->table('travel_order')->where('id', $id)->first();
        if (!$existing) {
            throw new RuntimeException('Travel order not found.');
        }

        $needsVehicle = $this->needsVehicle($data['isRequestingVehicle'] ?? false);
        $commutation = $this->normalizeCommutation($data['commutation_expenses'] ?? [], $needsVehicle);

        $schema = $conn2->getSchemaBuilder();
        $destHasIsMM = $schema->hasColumn('travel_order_destinations', 'isMetroManila');
        $destHasDistrict = $schema->hasColumn('travel_order_destinations', 'district');
        $destHasDistrictName = $schema->hasColumn('travel_order_destinations', 'districtName');

        $conn2->transaction(function () use (
            $conn2, $id, $data, $needsVehicle, $commutation, $actorIpmsId,
            $destHasIsMM, $destHasDistrict, $destHasDistrictName
        ) {
            $conn2->table('travel_order')->where('id', $id)->update([
                'travel_category_id' => $data['travel_category_id'],
                'travel_type' => $data['travel_type'],
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
                'updated_by' => $actorIpmsId,
                'date_updated' => Carbon::now(),
            ]);

            // STAFFS sync by emp_id
            $incomingStaffs = collect($data['staffs'] ?? [])
                ->map(fn ($s) => [
                    'emp_id' => $s['emp_id'],
                    'recommender_id' => $s['recommender_id'] ?? null,
                    'approver_id' => $s['approver_id'] ?? null,
                ])
                ->values();

            $incomingEmpIds = $incomingStaffs->pluck('emp_id')->filter()->values()->all();

            $conn2->table('travel_order_staffs')
                ->where('travel_order_id', $id)
                ->whereNotIn('emp_id', $incomingEmpIds)
                ->delete();

            foreach ($incomingStaffs as $staff) {
                $exists = $conn2->table('travel_order_staffs')
                    ->where('travel_order_id', $id)
                    ->where('emp_id', $staff['emp_id'])
                    ->exists();

                if ($exists) {
                    $conn2->table('travel_order_staffs')
                        ->where('travel_order_id', $id)
                        ->where('emp_id', $staff['emp_id'])
                        ->update([
                            'recommender_id' => $staff['recommender_id'],
                            'approver_id' => $staff['approver_id'],
                        ]);
                } else {
                    $conn2->table('travel_order_staffs')->insert([
                        'travel_order_id' => $id,
                        'emp_id' => $staff['emp_id'],
                        'recommender_id' => $staff['recommender_id'],
                        'approver_id' => $staff['approver_id'],
                    ]);
                }
            }

            // DESTINATIONS sync by id
            $existingDestIds = $conn2->table('travel_order_destinations')
                ->where('travel_order_id', $id)
                ->pluck('id')
                ->map(fn ($x) => (int) $x)
                ->values()
                ->all();

            $incomingDests = collect($data['destinations'] ?? [])->map(fn ($d) => [
                'id' => isset($d['id']) ? (int) $d['id'] : null,
                'type' => $d['type'] ?? null,
                'country' => $d['country'] ?? null,
                'location' => $d['location'] ?? null,
                'province' => $d['province'] ?? null,
                'provinceName' => $d['provinceName'] ?? null,
                'isMetroManila' => $d['isMetroManila'] ?? null,
                'district' => $d['district'] ?? null,
                'districtName' => $d['districtName'] ?? null,
                'citymun' => $d['citymun'] ?? null,
                'citymunName' => $d['citymunName'] ?? null,
            ])->values();

            $incomingDestIds = $incomingDests->pluck('id')->filter()->values()->all();

            if (count($existingDestIds) > 0 && count($incomingDestIds) === 0) {
                throw new RuntimeException('Destinations are missing IDs. Please refresh and try again.');
            }

            if (count($existingDestIds) > 0) {
                $conn2->table('travel_order_destinations')
                    ->where('travel_order_id', $id)
                    ->whereNotIn('id', $incomingDestIds)
                    ->delete();
            }

            foreach ($incomingDests as $dest) {
                $type = $dest['type'];
                $isMetro = filter_var($dest['isMetroManila'] ?? null, FILTER_VALIDATE_BOOLEAN) === true;

                $country = $type === 'Local' ? 'Philippines' : ($dest['country'] ?? null);
                $province = null;
                $provinceName = null;
                $district = null;
                $districtName = null;

                if ($type === 'Local') {
                    if ($isMetro) {
                        $provinceName = 'Metro Manila';
                        $district = $dest['district'] ?? null;
                        $districtName = $dest['districtName'] ?? null;
                    } else {
                        $province = $dest['province'] ?? null;
                        $provinceName = $dest['provinceName'] ?? null;
                    }
                }

                $payload = [
                    'type' => $type,
                    'location' => $dest['location'],
                    'country' => $country,
                    'province' => $province,
                    'provinceName' => $provinceName,
                    'citymun' => $type === 'Local' ? ($dest['citymun'] ?? null) : null,
                    'citymunName' => $type === 'Local' ? ($dest['citymunName'] ?? null) : null,
                ];

                if ($destHasIsMM) $payload['isMetroManila'] = ($type === 'Local' ? ($isMetro ? 1 : 0) : 0);
                if ($destHasDistrict) $payload['district'] = ($type === 'Local' && $isMetro) ? $district : null;
                if ($destHasDistrictName) $payload['districtName'] = ($type === 'Local' && $isMetro) ? $districtName : null;

                if (!empty($dest['id'])) {
                    $conn2->table('travel_order_destinations')
                        ->where('travel_order_id', $id)
                        ->where('id', $dest['id'])
                        ->update($payload);
                } else {
                    $conn2->table('travel_order_destinations')->insert(array_merge($payload, ['travel_order_id' => $id]));
                }
            }

            // EXPENSES sync
            if (!$needsVehicle) {
                $conn2->table('travel_order_expenses')->where('travel_order_id', $id)->delete();
            } else {
                $existingExpIds = $conn2->table('travel_order_expenses')
                    ->where('travel_order_id', $id)
                    ->pluck('id')
                    ->map(fn ($x) => (int) $x)
                    ->values()
                    ->all();

                $incomingExpIds = collect($commutation)->pluck('id')->filter()->values()->all();

                if (count($existingExpIds) > 0 && count($incomingExpIds) === 0) {
                    throw new RuntimeException('Commutation expenses are missing IDs. Please refresh and try again.');
                }

                if (count($existingExpIds) > 0) {
                    $conn2->table('travel_order_expenses')
                        ->where('travel_order_id', $id)
                        ->whereNotIn('id', $incomingExpIds)
                        ->delete();
                }

                foreach ($commutation as $row) {
                    $payload = [
                        'particulars' => $row['particulars'],
                        'amount' => $row['amount'],
                    ];

                    if (!empty($row['id'])) {
                        $conn2->table('travel_order_expenses')
                            ->where('travel_order_id', $id)
                            ->where('id', $row['id'])
                            ->update($payload);
                    } else {
                        $conn2->table('travel_order_expenses')->insert([
                            'travel_order_id' => $id,
                            'particulars' => $payload['particulars'],
                            'amount' => $payload['amount'],
                        ]);
                    }
                }
            }
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle(
                id: $id,
                data: $request->validated(),
                actorIpmsId: (string) $request->user()->ipms_id
            );

            return redirect()->route('travel-requests.show', $id)->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Travel request was updated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error("Failed to update travel request #{$id}: {$e->getMessage()}");

            return redirect()->back()->withInput()->with([
                'status' => 'error',
                'title' => 'Update travel request failed',
                'message' => $e instanceof RuntimeException
                    ? $e->getMessage()
                    : 'An error occurred while updating the travel request.',
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
                'id' => isset($row['id']) ? (int) $row['id'] : null,
                'particulars' => trim((string) ($row['particulars'] ?? '')),
                'amount' => (float) $amount,
            ];
        })->values()->all();
    }
}
