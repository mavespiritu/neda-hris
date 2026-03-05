<?php

namespace App\Http\Controllers\TravelOrders;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Gate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Arr;
use App\Support\DateRange;
use App\Support\IndexTableQuery;
use App\Models\VehicleRequest;
use App\States\VehicleRequest\Submitted as VrSubmitted;
use App\States\VehicleRequest\Endorsed as VrEndorsed;
use App\States\VehicleRequest\Approved as VrApproved;
use App\States\VehicleRequest\Reviewed as VrReviewed;
use App\States\VehicleRequest\VehicleAuthorized as VrAuthorized;
use App\States\VehicleRequest\Returned as VrReturned;
use App\States\VehicleRequest\Resubmitted as VrResubmitted;
use App\States\VehicleRequest\Draft as VrDraft;

class TravelRequestsController extends Controller
{
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        Gate::authorize('tr.viewAny');
        $canCreate = Gate::inspect('tr.create');

        $userEmpId = auth()->user()->ipms_id;

        $visibleEmployeeIdsQuery = Gate::forUser(Auth::user())
        ->raw('tr.visibleEmployeeIds');
        
        $baseQuery = $conn2->table('travel_order')
        ->where('request_type', 'TO')
        ->where(function ($q) use ($userEmpId) {
            $q->where('travel_order.created_by', $userEmpId)
                ->orWhereExists(function ($qq) use ($userEmpId) {
                    $qq->select(DB::raw(1))
                      ->from('travel_order_staffs as s')
                      ->whereColumn('s.travel_order_id', 'travel_order.id')
                      ->where('s.emp_id', $userEmpId);
              });
        });

        $travelOrders = IndexTableQuery::for($baseQuery)
        ->allowedFilters([
            'created_by' => fn($q, $v) => $q->where('created_by', $v),
            'start_date' => fn($q, $v) => $q->whereDate('start_date', Carbon::parse($v)->format('Y-m-d')),
        ])
        ->search(function ($q, string $term) use ($conn2, $conn3) {
            // your search logic...
        })
        ->allowedSorts([
            'start_date'   => 'start_date',
            'reference_no' => 'reference_no',

            // now OK because decorate() will populate these fields BEFORE sorting
            'creator' => function ($items, string $direction) {
                $sorted = $items->sortBy(fn ($t) => mb_strtolower((string) ($t->creator ?? '')));
                return $direction === 'desc' ? $sorted->reverse() : $sorted;
            },
            'status' => function ($items, string $direction) {
                $sorted = $items->sortBy(fn ($t) => mb_strtolower((string) ($t->status ?? '')));
                return $direction === 'desc' ? $sorted->reverse() : $sorted;
            },
        ])
        ->decorate(function ($items) use ($conn2, $conn3, $visibleEmployeeIdsQuery, $userEmpId) {
            $ids = $items->pluck('id')->all();

            $histories = $conn2->table('submission_history')
                ->where('model', 'TO')
                ->whereIn('model_id', $ids)
                ->orderBy('date_acted', 'desc')
                ->get()
                ->groupBy('model_id');

            $employees = $conn3->table('tblemployee')
                ->select(['emp_id', DB::raw('concat(lname, ", ", fname, " ", mname) as name')])
                ->whereIn('emp_id', $visibleEmployeeIdsQuery)
                ->get()
                ->keyBy('emp_id');

            $allEmployees = $conn3->table('tblemployee')
                ->select(['emp_id', DB::raw('concat(lname, ", ", fname, " ", mname) as name')])
                ->get()
                ->keyBy('emp_id');

            return $items->transform(function ($item) use ($employees, $allEmployees, $histories, $userEmpId) {
                $item->creator = $employees[$item->created_by]->name ?? null;

                $latest = $histories[$item->id][0] ?? null;
                if ($latest) {
                    $item->status        = $latest->status;
                    $item->acted_by      = $latest->acted_by;
                    $item->acted_by_name = $allEmployees[$latest->acted_by]->name ?? null;
                    $item->remarks       = $latest->remarks;
                    $item->date_acted    = $latest->date_acted;
                } else {
                    $item->status = $item->acted_by = $item->acted_by_name = $item->remarks = $item->date_acted = null;
                }

                $gate = Gate::forUser(Auth::user());

                $item->can = [
                    'edit' => $gate->inspect('tr.edit', $item->id)->allowed(),
                    'delete' => $gate->inspect('tr.delete', $item->id)->allowed(),
                    'view' => $gate->inspect('tr.view', $item->id)->allowed(),
                    'submit' => $gate->inspect('tr.submit', $item->id)->allowed(),
                ];

                return $item;
            });
        })
        ->defaultSort('reference_no', 'desc')
        ->apply($request)
        ->paginate($request, 20);


        return Inertia::render('TravelOrders/index', [
            'data' => [
                'travelOrders' => $travelOrders,
                'filters' => $request->only(['created_by', 'start_date', 'employee_name', 'sort', 'direction', 'search']),
            ],
            'can' => [
                'create' => $canCreate->allowed(),
            ],
        ]);
    }

    public function create()
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        Gate::authorize('tr.create');

        $categories = $conn2->table('travel_order_categories')
            ->select([
                'id as value',
                'title as label',
            ])
            ->orderBy('title')
            ->get();

        $fundSources = $conn2->table('travel_order_fund_sources')
            ->select([
                'id as value',
                'title as label',
            ])
            ->orderBy('title')
            ->get();

        // Signatory IDs by type
        $recommenderStaffUsers = $conn2->table('travel_order_signatories')
            ->where('type', 'Recommending_Staff_TO')
            ->pluck('signatory')
            ->filter()
            ->unique()
            ->values();

        $recommenderDCUsers = $conn2->table('travel_order_signatories')
            ->where('type', 'Recommending_DC_TO')
            ->pluck('signatory')
            ->filter()
            ->unique()
            ->values();

        $approverSignatory = $conn2->table('travel_order_signatories')
        ->select(['signatory', 'designation'])
        ->where('type', 'Approver_TO')
        ->whereNotNull('signatory')
        ->where('signatory', '!=', '')
        ->orderByDesc('id')
        ->first();

        $approver = null;

        if ($approverSignatory) {
            $approver = $conn3->table('tblemployee')
                ->select([
                    'emp_id',
                    DB::raw("
                        CONCAT(
                            fname,
                            ' ',
                            IF(mname IS NOT NULL AND mname != '',
                                CONCAT(LEFT(mname,1), '. '),
                                ''
                            ),
                            lname
                        ) as name
                    "),
                    'division_id',
                ])
                ->where('emp_id', $approverSignatory->signatory)
                ->where('work_status', 'active')
                ->first();

            if ($approver) {
                $approver->designation = $approverSignatory->designation; 
            }
        }

        // All active employees for the form
        $employees = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw("
                    CONCAT(
                        fname,
                        ' ',
                        IF(mname IS NOT NULL AND mname != '',
                            CONCAT(LEFT(mname,1), '. '),
                            ''
                        ),
                        lname
                    ) as name
                "),
                'division_id',
            ])
            ->where('work_status', 'active')
            ->orderBy('lname')
            ->orderBy('fname')
            ->orderBy('mname')
            ->get();

        /**
         * 1) STAFF recommending approver (per division)
         */
        $recommendingStaff = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw("
                    CONCAT(
                        fname,
                        ' ',
                        IF(mname IS NOT NULL AND mname != '',
                            CONCAT(LEFT(mname,1), '. '),
                            ''
                        ),
                        lname
                    ) as name
                "),
                'division_id',
            ])
            ->whereIn('emp_id', $recommenderStaffUsers)
            ->where('work_status', 'active')
            ->get();

        $staffByDivision = $recommendingStaff
            ->groupBy('division_id')
            ->map(fn ($group) => $group->first()); // pick 1 per division

        /**
         * 2) DC recommending approver (GLOBAL, disregard division)
         */
        $dcRecommender = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw("
                    CONCAT(
                        fname,
                        ' ',
                        IF(mname IS NOT NULL AND mname != '',
                            CONCAT(LEFT(mname,1), '. '),
                            ''
                        ),
                        lname
                    ) as name
                "),
                'division_id',
            ])
            ->whereIn('emp_id', $recommenderDCUsers)
            ->where('work_status', 'active')
            ->orderBy('lname')
            ->orderBy('fname')
            ->first(); // ✅ GLOBAL pick (first match)

        /**
         * 3) Apply rule:
         *    - If employee is a Recommending_Staff signatory => recommending = global DC recommender
         *    - Else => recommending = staff recommender per division
         */
        $isRecommendingStaff = $recommenderStaffUsers->flip(); // emp_id => index

        $employees = $employees->map(function ($emp) use ($isRecommendingStaff, $dcRecommender, $staffByDivision) {
            $emp->recommending = isset($isRecommendingStaff[$emp->emp_id])
                ? $dcRecommender
                : $staffByDivision->get($emp->division_id);

            return $emp;
        });

        $employees = $employees->keyBy('emp_id');

        $year = now()->format('Y');

        $latestRef = $conn2->table('travel_order')
            ->where('reference_no', 'like', $year . '%')
            ->where('request_type', 'TO')
            ->orderByDesc('reference_no')
            ->value('reference_no');

        $nextRef = null;

        if ($latestRef) {
            $counter = (int) substr((string) $latestRef, 4);
            $nextCounter = $counter + 1;

            $nextRef = $year . str_pad((string) $nextCounter, 4, '0', STR_PAD_LEFT);
        } else {
            $nextRef = $year . '0001';
        }

        return Inertia::render('TravelOrders/Create', [
            'data' => [
                'categories' => $categories,
                'fundSources' => $fundSources,
                'employees'        => $employees,
                'approver'         => $approver,
                'reference_no'     => $nextRef,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        // Build validator so we can conditionally apply rules
        $validator = Validator::make($request->all(), [
            'travel_category_id' => ['required', 'integer'],
            'travel_type'        => ['required'],
            'start_date'         => ['required', 'date'],
            'end_date'           => ['required', 'date', 'after_or_equal:start_date'],
            'purpose'            => ['required', 'string'],
            'fund_source_id'     => ['required'],

            // at least one staff selected
            'staffs'   => ['required', 'array', 'min:1'],
            'staffs.*' => ['required'],

            // at least one destination
            'destinations'             => ['required', 'array', 'min:1'],
            'destinations.*.type'      => ['nullable', 'string'],  // Local | International
            'destinations.*.location'  => ['required', 'string'],
            'destinations.*.country'   => ['nullable', 'string'],

            // local (province path)
            'destinations.*.province'  => ['nullable', 'string'],
            'destinations.*.provinceName' => ['nullable', 'string'],

            // local (metro manila path)
            'destinations.*.isMetroManila' => ['nullable'],       // checkbox-ish
            'destinations.*.district'      => ['nullable', 'string'],
            'destinations.*.districtName'  => ['nullable', 'string'],

            // shared local
            'destinations.*.citymun'   => ['nullable', 'string'],
            'destinations.*.citymunName' => ['nullable', 'string'],

            'other_passengers' => ['nullable', 'string'],
            'other_vehicles'   => ['nullable', 'string'],
            'other_drivers'    => ['nullable', 'string'],

            // IMPORTANT: keep this, but we will interpret it safely below
            'isRequestingVehicle' => ['nullable'],

            // vehicle-request-only fields (required conditionally in after())
            'est_distance'       => ['nullable', 'numeric', 'min:0.01'],
            /* 'est_departure_time' => ['nullable', 'date_format:H:i'],
            'est_arrival_time'   => ['nullable', 'date_format:H:i'], */

            // commutation container
            'commutation_expenses' => ['nullable', 'array'],
        ], [
            'staffs.required'             => 'Please select at least one authorized personnel.',
            'staffs.min'                  => 'Please select at least one authorized personnel.',
            'destinations.required'       => 'Please add at least one destination.',
            'destinations.min'            => 'Please add at least one destination.',
            'travel_category_id.required' => 'The travel category field is required.',
        ]);

        // ✅ interpret "isRequestingVehicle" reliably as boolean + validate vehicle-only fields
        $validator->after(function ($v) use ($request) {
            $needsVehicle = filter_var(
                $request->input('isRequestingVehicle'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) === true;

            if (!$needsVehicle) return;

            $dist = $request->input('est_distance');
            $dep  = $request->input('est_departure_time');
            $arr  = $request->input('est_arrival_time');

            if ($dist === null || $dist === '' || !is_numeric($dist) || (float)$dist <= 0) {
                $v->errors()->add('est_distance', 'Estimated distance is required and must be greater than 0.');
            }
            if ($dep === null || trim((string)$dep) === '') {
                $v->errors()->add('est_departure_time', 'Estimated departure time is required.');
            }
            if ($arr === null || trim((string)$arr) === '') {
                $v->errors()->add('est_arrival_time', 'Estimated arrival time is required.');
            }

            $comm = $request->input('commutation_expenses');

            if (!is_array($comm) || count($comm) < 1) {
                $v->errors()->add('commutation_expenses', 'Please add at least one commutation expense entry.');
                return;
            }

            foreach ($comm as $i => $row) {
                $particulars = is_array($row) ? ($row['particulars'] ?? null) : null;
                $amount      = is_array($row) ? ($row['amount'] ?? null) : null;

                if ($particulars === null || trim((string)$particulars) === '') {
                    $v->errors()->add("commutation_expenses.$i.particulars", 'Particulars is required.');
                }

                if (is_string($amount)) {
                    $amount = str_replace([',', '₱', ' '], '', $amount);
                }

                if ($amount === null || $amount === '' || !is_numeric($amount) || (float)$amount <= 0) {
                    $v->errors()->add("commutation_expenses.$i.amount", 'Amount is required and must be a number greater than 0.');
                }
            }
        });

        $validated = $validator->validate();

        // ✅ Conditional destination validation (Local vs International) + Metro Manila branch
        foreach (($validated['destinations'] ?? []) as $i => $dest) {
            $type = $dest['type'] ?? null;

            if ($type === 'Local') {
                $isMetroManila = filter_var($dest['isMetroManila'] ?? null, FILTER_VALIDATE_BOOLEAN) === true;

                if ($isMetroManila) {
                    if (empty($dest['district'])) {
                        return back()->withErrors([
                            "destinations.$i.district" => "District is required for Metro Manila destinations.",
                        ])->withInput();
                    }
                    if (empty($dest['citymun'])) {
                        return back()->withErrors([
                            "destinations.$i.citymun" => "City/Municipality is required for Metro Manila destinations.",
                        ])->withInput();
                    }
                } else {
                    if (empty($dest['province'])) {
                        return back()->withErrors([
                            "destinations.$i.province" => "Province is required for local destinations.",
                        ])->withInput();
                    }
                    if (empty($dest['citymun'])) {
                        return back()->withErrors([
                            "destinations.$i.citymun" => "City/Municipality is required for local destinations.",
                        ])->withInput();
                    }
                }
            }

            if ($type === 'International') {
                if (empty($dest['country'])) {
                    return back()->withErrors([
                        "destinations.$i.country" => "Country is required for international destinations.",
                    ])->withInput();
                }
            }
        }

        // ✅ normalize commutation (optional but recommended before saving)
        $needsVehicle = filter_var($request->input('isRequestingVehicle'), FILTER_VALIDATE_BOOLEAN) === true;

        $commutation = [];
        if ($needsVehicle) {
            $commutation = collect($request->input('commutation_expenses', []))
                ->map(function ($row) {
                    $amount = $row['amount'] ?? 0;

                    if (is_string($amount)) {
                        $amount = str_replace([',', '₱', ' '], '', $amount);
                    }

                    return [
                        'particulars' => trim((string)($row['particulars'] ?? '')),
                        'amount'      => (float)$amount,
                    ];
                })
                ->values()
                ->all();
        }

        try {
            $conn2->beginTransaction();

            $travelOrderId = $conn2->table('travel_order')
                ->insertGetId([
                    'reference_no'        => $request->input('reference_no'),
                    'request_type'        => 'TO',
                    'travel_type'         => $request->input('travel_type'),
                    'travel_category_id'  => $request->input('travel_category_id'),
                    'start_date'          => $request->input('start_date'),
                    'end_date'            => $request->input('end_date'),
                    'purpose'             => $request->input('purpose'),
                    'fund_source_id'      => $request->input('fund_source_id'),
                    'other_passengers'    => $request->input('other_passengers') ?: null,
                    'other_vehicles'      => $request->input('other_vehicles') ?: null,
                    'other_drivers'       => $request->input('other_drivers') ?: null,

                    'isRequestingVehicle' => $needsVehicle ? 1 : 0,
                    'est_distance'        => $needsVehicle ? $request->input('est_distance') : null,
                    'est_departure_time'  => $needsVehicle ? $request->input('est_departure_time') : null,
                    'est_arrival_time'    => $needsVehicle ? $request->input('est_arrival_time') : null,

                    'created_by'          => Auth::user()->ipms_id,
                    'date_created'        => Carbon::now(),
                    'division'            => Auth::user()->division
                ]);

            foreach ($request->input('staffs', []) as $staff) {
                $conn2->table('travel_order_staffs')->insert([
                    'travel_order_id' => $travelOrderId,
                    'emp_id'          => $staff['emp_id'],
                    'recommender_id'  => $staff['recommender_id'] ?? null,
                    'approver_id'     => $staff['approver_id'] ?? null,
                ]);
            }

            foreach ($request->input('destinations', []) as $dest) {
                $isMetroManila = filter_var($dest['isMetroManila'] ?? null, FILTER_VALIDATE_BOOLEAN) === true;

                // If local + metro manila, force some normalization so DB is consistent
                $type = $dest['type'] ?? null;

                $country = $dest['country'] ?? null;
                if ($type === 'Local') $country = 'Philippines';

                $province = $dest['province'] ?? null;
                $provinceName = $dest['provinceName'] ?? null;

                $district = $dest['district'] ?? null;
                $districtName = $dest['districtName'] ?? null;

                if ($type === 'Local' && $isMetroManila) {
                    $province = null;
                    $provinceName = 'Metro Manila';
                } else {
                    // not metro manila -> clear district
                    $district = null;
                    $districtName = null;
                }

                $conn2->table('travel_order_destinations')->insert([
                    'travel_order_id' => $travelOrderId,
                    'type'            => $type,
                    'country'         => $country,
                    'province'        => $province,
                    'provinceName'    => $provinceName,

                    // ✅ requires columns in DB; see note below
                    'district'        => $district,
                    'districtName'    => $districtName,
                    'isMetroManila'   => $type === 'Local' ? ($isMetroManila ? 1 : 0) : 0,

                    'citymun'         => $dest['citymun'] ?? null,
                    'citymunName'     => $dest['citymunName'] ?? null,
                    'location'        => $dest['location'] ?? null,
                ]);
            }

            if ($needsVehicle) {
                foreach ($commutation as $comm) {
                    $conn2->table('travel_order_expenses')->insert([
                        'travel_order_id' => $travelOrderId,
                        'particulars'     => $comm['particulars'],
                        'amount'          => $comm['amount'],
                    ]);
                }
            }

            $conn2->table('submission_history')->insert([
                'model'      => 'TO',
                'model_id'   => $travelOrderId,
                'status'     => 'Draft',
                'acted_by'   => Auth::user()->ipms_id,
                'date_acted' => Carbon::now(),
            ]);

            $conn2->commit();

            return redirect()->route('travel-requests.show', ['travel_request' => $travelOrderId])->with([
                'status'  => 'success',
                'title'   => 'Success!',
                'message' => 'Travel request was saved successfully.',
            ]);
        } catch (Exception $e) {
            $conn2->rollBack();
            Log::error("Failed to save travel request: {$e->getMessage()}");
            return redirect()->back()->with([
                'status'  => 'error',
                'title'   => 'Save travel request failed',
                'message' => 'An error occurred while saving the travel request.',
            ]);
        }
    }

    public function edit($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        Gate::authorize('tr.edit', $id);

        // ---- same dropdowns as create() ----
        $categories = $conn2->table('travel_order_categories')
            ->select(['id as value', 'title as label'])
            ->orderBy('title')
            ->get();

        $fundSources = $conn2->table('travel_order_fund_sources')
            ->select(['id as value', 'title as label'])
            ->orderBy('title')
            ->get();

        // ---- signatories (same logic as create()) ----
        $recommenderStaffUsers = $conn2->table('travel_order_signatories')
            ->where('type', 'Recommending_Staff_TO')
            ->pluck('signatory')
            ->filter()
            ->unique()
            ->values();

        $recommenderDCUsers = $conn2->table('travel_order_signatories')
            ->where('type', 'Recommending_DC_TO')
            ->pluck('signatory')
            ->filter()
            ->unique()
            ->values();

        $approverSignatory = $conn2->table('travel_order_signatories')
            ->select(['signatory', 'designation'])
            ->where('type', 'Approver_TO')
            ->whereNotNull('signatory')
            ->where('signatory', '!=', '')
            ->orderByDesc('id')
            ->first();

        $approver = null;

        if ($approverSignatory) {
            $approver = $conn3->table('tblemployee')
                ->select([
                    'emp_id',
                    DB::raw("
                        CONCAT(
                            fname,
                            ' ',
                            IF(mname IS NOT NULL AND mname != '',
                                CONCAT(LEFT(mname,1), '. '),
                                ''
                            ),
                            lname
                        ) as name
                    "),
                    'division_id',
                ])
                ->where('emp_id', $approverSignatory->signatory)
                ->where('work_status', 'active')
                ->first();

            if ($approver) {
                $approver->designation = $approverSignatory->designation;
            }
        }

        // ---- employees (same as create()) ----
        $employees = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw("
                    CONCAT(
                        fname,
                        ' ',
                        IF(mname IS NOT NULL AND mname != '',
                            CONCAT(LEFT(mname,1), '. '),
                            ''
                        ),
                        lname
                    ) as name
                "),
                'division_id',
            ])
            ->where('work_status', 'active')
            ->orderBy('lname')
            ->orderBy('fname')
            ->orderBy('mname')
            ->get();

        // 1) STAFF recommending approver (per division)
        $recommendingStaff = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw("
                    CONCAT(
                        fname,
                        ' ',
                        IF(mname IS NOT NULL AND mname != '',
                            CONCAT(LEFT(mname,1), '. '),
                            ''
                        ),
                        lname
                    ) as name
                "),
                'division_id',
            ])
            ->whereIn('emp_id', $recommenderStaffUsers)
            ->where('work_status', 'active')
            ->get();

        $staffByDivision = $recommendingStaff
            ->groupBy('division_id')
            ->map(fn ($group) => $group->first());

        // 2) DC recommending approver (GLOBAL)
        $dcRecommender = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw("
                    CONCAT(
                        fname,
                        ' ',
                        IF(mname IS NOT NULL AND mname != '',
                            CONCAT(LEFT(mname,1), '. '),
                            ''
                        ),
                        lname
                    ) as name
                "),
                'division_id',
            ])
            ->whereIn('emp_id', $recommenderDCUsers)
            ->where('work_status', 'active')
            ->orderBy('lname')
            ->orderBy('fname')
            ->first();

        // 3) Apply rule
        $isRecommendingStaff = $recommenderStaffUsers->flip();

        $employees = $employees->map(function ($emp) use ($isRecommendingStaff, $dcRecommender, $staffByDivision) {
            $emp->recommending = isset($isRecommendingStaff[$emp->emp_id])
                ? $dcRecommender
                : $staffByDivision->get($emp->division_id);

            return $emp;
        })->keyBy('emp_id');

        $order = $conn2->table('travel_order')->where('id', $id)->first();

        if (!$order) {
            return redirect()->route('travel-requests.index')->with([
                'status' => 'error',
                'title' => 'Not found',
                'message' => 'Travel order not found.',
            ]);
        }

        $staffs = $conn2->table('travel_order_staffs')
            ->select(['id', 'emp_id', 'recommender_id', 'approver_id'])
            ->where('travel_order_id', $id)
            ->get()
            ->map(fn ($s) => [
                'id' => (int) $s->id,
                'emp_id' => (string) $s->emp_id,
                'recommender_id' => $s->recommender_id ? (string) $s->recommender_id : null,
                'approver_id' => $s->approver_id ? (string) $s->approver_id : null,
            ])
            ->values();

        /**
         * ✅ Destinations: adjust to match the revised DestinationForm shape.
         *
         * Notes:
         * - If you already added DB columns: district, districtName, isMetroManila -> we read them.
         * - If you DID NOT add them, we infer Metro Manila using provinceName / province values.
         */
        $destinationsRaw = $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $id)
            ->get();

        $destinations = $destinationsRaw
            ->map(function ($d) {
                // Safe property reads (won't error if columns don't exist)
                $district = property_exists($d, 'district') ? $d->district : null;
                $districtName = property_exists($d, 'districtName') ? $d->districtName : null;
                $isMetroManilaCol = property_exists($d, 'isMetroManila') ? $d->isMetroManila : null;

                // If column exists, prefer it; else infer from province/provinceName
                $isMetroManila = false;
                if ($isMetroManilaCol !== null) {
                    $isMetroManila = (bool) $isMetroManilaCol;
                } else {
                    $prov = trim((string)($d->province ?? ''));
                    $provName = trim((string)($d->provinceName ?? ''));
                    $isMetroManila = ($provName === 'Metro Manila' || $prov === 'Metro Manila' || $prov === 'NCR');
                }

                return [
                    'id' => (int) $d->id,
                    'type' => $d->type,
                    'country' => $d->country,
                    'location' => $d->location,

                    // province path
                    'province' => $isMetroManila ? '' : ($d->province ?? ''),
                    'provinceName' => $isMetroManila ? 'Metro Manila' : ($d->provinceName ?? ''),

                    // metro manila path
                    'isMetroManila' => $isMetroManila,
                    'district' => $isMetroManila ? ($district ?? '') : '',
                    'districtName' => $isMetroManila ? ($districtName ?? '') : '',

                    // shared local
                    'citymun' => $d->citymun ?? '',
                    'citymunName' => $d->citymunName ?? '',
                ];
            })
            ->values();

        $commutation = $conn2->table('travel_order_expenses')
            ->select(['id', 'particulars', 'amount'])
            ->where('travel_order_id', $id)
            ->get()
            ->map(fn ($e) => [
                'id' => (int) $e->id,
                'particulars' => $e->particulars,
                'amount' => (float) $e->amount,
            ])
            ->values();

        // ✅ prepare data shape expected by your Form
        $data = [
            'id' => $order->id,
            'reference_no' => $order->reference_no,
            'travel_category_id' => $order->travel_category_id,
            'start_date' => $order->start_date,
            'end_date' => $order->end_date,
            'purpose' => $order->purpose,
            'fund_source_id' => $order->fund_source_id,
            'other_passengers' => $order->other_passengers,
            'other_vehicles' => $order->other_vehicles,
            'other_drivers' => $order->other_drivers,
            'isRequestingVehicle' => (bool) $order->isRequestingVehicle,
            'date_created' => $order->date_created,
            'staffs' => $staffs,

            // ✅ updated destinations
            'destinations' => $destinations,

            'commutation_expenses' => $commutation,
            'est_distance' => $order->est_distance,
            'est_departure_time' => $order->est_departure_time,
            'est_arrival_time' => $order->est_arrival_time,
        ];

        return Inertia::render('TravelOrders/Edit', [
            'data' => [
                'categories'   => $categories,
                'fundSources'  => $fundSources,
                'employees'    => $employees,
                'approver'     => $approver,
                'reference_no' => $order->reference_no,
                'data'         => $data,
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'travel_category_id' => ['required', 'integer'],
            'travel_type'        => ['required'],
            'start_date'         => ['required', 'date'],
            'end_date'           => ['required', 'date', 'after_or_equal:start_date'],
            'purpose'            => ['required', 'string'],
            'fund_source_id'     => ['required'],

            'staffs'   => ['required', 'array', 'min:1'],
            'staffs.*' => ['required'],

            'destinations'                 => ['required', 'array', 'min:1'],
            'destinations.*.id'            => ['nullable', 'integer'],
            'destinations.*.type'          => ['nullable', 'string'],
            'destinations.*.location'      => ['required', 'string'],
            'destinations.*.country'       => ['nullable', 'string'],

            // local (province path)
            'destinations.*.province'      => ['nullable', 'string'],
            'destinations.*.provinceName'  => ['nullable', 'string'],

            // local (metro manila path)
            'destinations.*.isMetroManila' => ['nullable'],
            'destinations.*.district'      => ['nullable', 'string'],
            'destinations.*.districtName'  => ['nullable', 'string'],

            // local shared
            'destinations.*.citymun'       => ['nullable', 'string'],
            'destinations.*.citymunName'   => ['nullable', 'string'],

            'other_passengers' => ['nullable', 'string'],
            'other_vehicles'   => ['nullable', 'string'],
            'other_drivers'    => ['nullable', 'string'],

            'isRequestingVehicle' => ['nullable'],

            // vehicle-request-only fields (required conditionally in after())
            'est_distance'       => ['nullable', 'numeric', 'min:0.01'],
            /* 'est_departure_time' => ['nullable', 'date_format:H:i'],
            'est_arrival_time'   => ['nullable', 'date_format:H:i'], */

            'commutation_expenses'               => ['nullable', 'array'],
            'commutation_expenses.*.id'          => ['nullable', 'integer'],
            'commutation_expenses.*.particulars' => ['nullable', 'string'],
            'commutation_expenses.*.amount'      => ['nullable'],
        ], [
            'staffs.required'             => 'Please select at least one authorized personnel.',
            'staffs.min'                  => 'Please select at least one authorized personnel.',
            'destinations.required'       => 'Please add at least one destination.',
            'destinations.min'            => 'Please add at least one destination.',
            'travel_category_id.required' => 'The travel category field is required.',
        ]);

        // ✅ interpret isRequestingVehicle reliably + validate vehicle-only fields + commutation rows if enabled
        $validator->after(function ($v) use ($request) {
            $needsVehicle = filter_var(
                $request->input('isRequestingVehicle'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) === true;

            if (!$needsVehicle) return;

            $dist = $request->input('est_distance');
            $dep  = $request->input('est_departure_time');
            $arr  = $request->input('est_arrival_time');

            if ($dist === null || $dist === '' || !is_numeric($dist) || (float)$dist <= 0) {
                $v->errors()->add('est_distance', 'Estimated distance is required and must be greater than 0.');
            }
            if ($dep === null || trim((string)$dep) === '') {
                $v->errors()->add('est_departure_time', 'Estimated departure time is required.');
            }
            if ($arr === null || trim((string)$arr) === '') {
                $v->errors()->add('est_arrival_time', 'Estimated arrival time is required.');
            }


            $comm = $request->input('commutation_expenses');

            if (!is_array($comm) || count($comm) < 1) {
                $v->errors()->add('commutation_expenses', 'Please add at least one commutation expense entry.');
                return;
            }

            foreach ($comm as $i => $row) {
                $particulars = is_array($row) ? ($row['particulars'] ?? null) : null;
                $amount      = is_array($row) ? ($row['amount'] ?? null) : null;

                if ($particulars === null || trim((string)$particulars) === '') {
                    $v->errors()->add("commutation_expenses.$i.particulars", 'Particulars is required.');
                }

                if (is_string($amount)) {
                    $amount = str_replace([',', '₱', ' '], '', $amount);
                }

                if ($amount === null || $amount === '' || !is_numeric($amount) || (float)$amount <= 0) {
                    $v->errors()->add("commutation_expenses.$i.amount", 'Amount is required and must be a number greater than 0.');
                }
            }
        });

        $validated = $validator->validate();

        // ✅ conditional destination validation (Local vs International) + Metro Manila branch
        foreach (($validated['destinations'] ?? []) as $i => $dest) {
            $type = $dest['type'] ?? null;

            if ($type === 'Local') {
                $isMetroManila = filter_var($dest['isMetroManila'] ?? null, FILTER_VALIDATE_BOOLEAN) === true;

                if ($isMetroManila) {
                    if (empty($dest['district'])) {
                        return back()->withErrors([
                            "destinations.$i.district" => "District is required for Metro Manila destinations.",
                        ])->withInput();
                    }
                    if (empty($dest['citymun'])) {
                        return back()->withErrors([
                            "destinations.$i.citymun" => "City/Municipality is required for Metro Manila destinations.",
                        ])->withInput();
                    }
                } else {
                    if (empty($dest['province'])) {
                        return back()->withErrors([
                            "destinations.$i.province" => "Province is required for local destinations.",
                        ])->withInput();
                    }
                    if (empty($dest['citymun'])) {
                        return back()->withErrors([
                            "destinations.$i.citymun" => "City/Municipality is required for local destinations.",
                        ])->withInput();
                    }
                }
            }

            if ($type === 'International') {
                if (empty($dest['country'])) {
                    return back()->withErrors([
                        "destinations.$i.country" => "Country is required for international destinations.",
                    ])->withInput();
                }
            }
        }

        // ✅ normalize needsVehicle + commutation
        $needsVehicle = filter_var($request->input('isRequestingVehicle'), FILTER_VALIDATE_BOOLEAN) === true;

        $commutation = [];
        if ($needsVehicle) {
            $commutation = collect($request->input('commutation_expenses', []))
                ->map(function ($row) {
                    $amount = $row['amount'] ?? 0;
                    if (is_string($amount)) {
                        $amount = str_replace([',', '₱', ' '], '', $amount);
                    }
                    return [
                        'id'          => isset($row['id']) ? (int) $row['id'] : null,
                        'particulars' => trim((string) ($row['particulars'] ?? '')),
                        'amount'      => (float) $amount,
                    ];
                })
                ->values()
                ->all();
        }

        // ensure order exists
        $existing = $conn2->table('travel_order')->where('id', $id)->first();
        if (!$existing) {
            return redirect()->route('travel-requests.index')->with([
                'status'  => 'error',
                'title'   => 'Not found',
                'message' => 'Travel order not found.',
            ]);
        }

        // detect if destination table supports metro manila columns (so code works even without migration)
        $destinationsSchema = $conn2->getSchemaBuilder();
        $destHasIsMM = $destinationsSchema->hasColumn('travel_order_destinations', 'isMetroManila');
        $destHasDistrict = $destinationsSchema->hasColumn('travel_order_destinations', 'district');
        $destHasDistrictName = $destinationsSchema->hasColumn('travel_order_destinations', 'districtName');

        try {
            $conn2->beginTransaction();

            // 1) update main order
            $conn2->table('travel_order')
                ->where('id', $id)
                ->update([
                    'travel_category_id'  => $request->input('travel_category_id'),
                    'travel_type'         => $request->input('travel_type'),
                    'start_date'          => $request->input('start_date'),
                    'end_date'            => $request->input('end_date'),
                    'purpose'             => $request->input('purpose'),
                    'fund_source_id'      => $request->input('fund_source_id'),
                    'other_passengers'    => $request->input('other_passengers') ?: null,
                    'other_vehicles'      => $request->input('other_vehicles') ?: null,
                    'other_drivers'       => $request->input('other_drivers') ?: null,

                    'isRequestingVehicle' => $needsVehicle ? 1 : 0,
                    'est_distance'        => $needsVehicle ? $request->input('est_distance') : null,
                    'est_departure_time'  => $needsVehicle ? $request->input('est_departure_time') : null,
                    'est_arrival_time'    => $needsVehicle ? $request->input('est_arrival_time') : null,

                    'updated_by'          => Auth::user()->ipms_id ?? null,
                    'date_updated'        => Carbon::now(),
                ]);

            /**
             * 2) STAFFS (sync by emp_id)
             */
            $incomingStaffs = collect($request->input('staffs', []))
                ->map(fn ($s) => [
                    'emp_id'         => $s['emp_id'],
                    'recommender_id' => $s['recommender_id'] ?? null,
                    'approver_id'    => $s['approver_id'] ?? null,
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
                    ->first();

                if ($exists) {
                    $conn2->table('travel_order_staffs')
                        ->where('travel_order_id', $id)
                        ->where('emp_id', $staff['emp_id'])
                        ->update([
                            'recommender_id' => $staff['recommender_id'],
                            'approver_id'    => $staff['approver_id'],
                        ]);
                } else {
                    $conn2->table('travel_order_staffs')->insert([
                        'travel_order_id' => $id,
                        'emp_id'          => $staff['emp_id'],
                        'recommender_id'  => $staff['recommender_id'],
                        'approver_id'     => $staff['approver_id'],
                    ]);
                }
            }

            /**
             * 3) DESTINATIONS (ID-based sync)
             */
            $existingDestIds = $conn2->table('travel_order_destinations')
                ->where('travel_order_id', $id)
                ->pluck('id')
                ->map(fn ($x) => (int) $x)
                ->values()
                ->all();

            $incomingDests = collect($request->input('destinations', []))
                ->map(function ($d) {
                    return [
                        'id'            => isset($d['id']) ? (int) $d['id'] : null,
                        'type'          => $d['type'] ?? null,
                        'country'       => $d['country'] ?? null,
                        'location'      => $d['location'] ?? null,

                        'province'      => $d['province'] ?? null,
                        'provinceName'  => $d['provinceName'] ?? null,

                        'isMetroManila' => $d['isMetroManila'] ?? null,
                        'district'      => $d['district'] ?? null,
                        'districtName'  => $d['districtName'] ?? null,

                        'citymun'       => $d['citymun'] ?? null,
                        'citymunName'   => $d['citymunName'] ?? null,
                    ];
                })
                ->values();

            $incomingDestIds = $incomingDests->pluck('id')->filter()->values()->all();

            if (count($existingDestIds) > 0 && count($incomingDestIds) === 0) {
                return back()->withErrors([
                    'destinations' => 'Destinations are missing IDs. Please refresh the page and try again.',
                ])->withInput();
            }

            if (count($existingDestIds) > 0) {
                $conn2->table('travel_order_destinations')
                    ->where('travel_order_id', $id)
                    ->whereNotIn('id', $incomingDestIds)
                    ->delete();
            }

            foreach ($incomingDests as $dest) {
                $type = $dest['type'];

                $isMetroManila = filter_var($dest['isMetroManila'] ?? null, FILTER_VALIDATE_BOOLEAN) === true;

                // normalize fields so DB stays consistent
                $country = $type === 'Local' ? 'Philippines' : ($dest['country'] ?? null);

                $province = null;
                $provinceName = null;
                $district = null;
                $districtName = null;

                if ($type === 'Local') {
                    if ($isMetroManila) {
                        $province = null;
                        $provinceName = 'Metro Manila';
                        $district = $dest['district'] ?? null;
                        $districtName = $dest['districtName'] ?? null;
                    } else {
                        $province = $dest['province'] ?? null;
                        $provinceName = $dest['provinceName'] ?? null;
                        $district = null;
                        $districtName = null;
                    }
                }

                $payload = [
                    'type'         => $type,
                    'location'     => $dest['location'],
                    'country'      => $country,

                    'province'     => $province,
                    'provinceName' => $provinceName,

                    'citymun'      => $type === 'Local' ? ($dest['citymun'] ?? null) : null,
                    'citymunName'  => $type === 'Local' ? ($dest['citymunName'] ?? null) : null,
                ];

                // conditionally include new columns if they exist
                if ($destHasIsMM) $payload['isMetroManila'] = ($type === 'Local' ? ($isMetroManila ? 1 : 0) : 0);
                if ($destHasDistrict) $payload['district'] = ($type === 'Local' && $isMetroManila) ? $district : null;
                if ($destHasDistrictName) $payload['districtName'] = ($type === 'Local' && $isMetroManila) ? $districtName : null;

                if (!empty($dest['id'])) {
                    $conn2->table('travel_order_destinations')
                        ->where('travel_order_id', $id)
                        ->where('id', $dest['id'])
                        ->update($payload);
                } else {
                    $insert = array_merge($payload, ['travel_order_id' => $id]);

                    $conn2->table('travel_order_destinations')->insert($insert);
                }
            }

            /**
             * 4) EXPENSES (ID-based sync only)
             */
            if (!$needsVehicle) {
                $conn2->table('travel_order_expenses')
                    ->where('travel_order_id', $id)
                    ->delete();
            } else {
                $existingExpIds = $conn2->table('travel_order_expenses')
                    ->where('travel_order_id', $id)
                    ->pluck('id')
                    ->map(fn ($x) => (int) $x)
                    ->values()
                    ->all();

                $incomingExpIds = collect($commutation)->pluck('id')->filter()->values()->all();

                if (count($existingExpIds) > 0 && count($incomingExpIds) === 0) {
                    return back()->withErrors([
                        'commutation_expenses' => 'Commutation expenses are missing IDs. Please refresh the page and try again.',
                    ])->withInput();
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
                        'amount'      => $row['amount'],
                    ];

                    if (!empty($row['id'])) {
                        $conn2->table('travel_order_expenses')
                            ->where('travel_order_id', $id)
                            ->where('id', $row['id'])
                            ->update($payload);
                    } else {
                        $conn2->table('travel_order_expenses')->insert([
                            'travel_order_id' => $id,
                            'particulars'     => $payload['particulars'],
                            'amount'          => $payload['amount'],
                        ]);
                    }
                }
            }

            $conn2->commit();

            return redirect()->route('travel-requests.show', ['travel_request' => $id])->with([
                'status'  => 'success',
                'title'   => 'Success!',
                'message' => 'Travel request was updated successfully.',
            ]);
        } catch (Exception $e) {
            $conn2->rollBack();
            Log::error("Failed to update travel request #{$id}: {$e->getMessage()}");

            return redirect()->back()->with([
                'status'  => 'error',
                'title'   => 'Update travel request failed',
                'message' => 'An error occurred while updating the travel request.',
            ])->withInput();
        }
    }

    public function show($id)
    {
        Gate::authorize('tr.view', $id);

        $canSubmit     = Gate::inspect('tr.submit', $id);
        $canEdit       = Gate::inspect('tr.edit', $id);
        $canView       = Gate::inspect('tr.view', $id);
        $canDelete     = Gate::inspect('tr.delete', $id);
        $canEndorse    = Gate::inspect('vr.endorse', $id);
        $canApprove    = Gate::inspect('vr.approve', $id);
        $canReview     = Gate::inspect('vr.review', $id);
        $canAuthorize  = Gate::inspect('vr.authorize', $id);
        $canDisapprove = Gate::inspect('vr.disapprove', $id);
        $canReturn     = Gate::inspect('vr.return', $id);

        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $order = $conn2->table('travel_order')
            ->select([
                'travel_order.id',
                'reference_no',
                'travel_category_id',
                'start_date',
                'end_date',
                'purpose',
                'fund_source_id',
                'other_passengers',
                'other_vehicles',
                'other_drivers',
                'isRequestingVehicle',
                'created_by',
                'date_created',
                'travel_order_categories.title as category_title',
                'travel_order_fund_sources.title as fund_source_title',
                'approver_id',
                'est_distance',
                'est_departure_time',
                'est_arrival_time'
            ])
            ->leftJoin('travel_order_categories', 'travel_order.travel_category_id', '=', 'travel_order_categories.id')
            ->leftJoin('travel_order_fund_sources', 'travel_order.fund_source_id', '=', 'travel_order_fund_sources.id')
            ->where('travel_order.id', $id)
            ->first();

        if (!$order) {
            return redirect()->route('travel-requests.index')->with([
                'status' => 'error',
                'title' => 'Not found',
                'message' => 'Travel request not found.',
            ]);
        }

        $latestHistory = $conn2->table('submission_history')
            ->where('model', 'TO')
            ->where('model_id', $id)
            ->orderBy('date_acted', 'desc')
            ->first();

        $latestVehicleRequestHistory = $conn2->table('submission_history')
            ->where('model', 'Vehicle Request')
            ->where('model_id', $id)
            ->orderBy('date_acted', 'desc')
            ->first();

        $staffRows = $conn2->table('travel_order_staffs')
            ->select(['id', 'emp_id', 'recommender_id', 'approver_id'])
            ->where('travel_order_id', $id)
            ->get();

        $destinations = $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $id)
            ->get();

        $commutation_expenses = $conn2->table('travel_order_expenses')
            ->where('travel_order_id', $id)
            ->get();

        $vehicles = $conn2->table('travel_order_vehicles')
            ->select(['id as value', 'vehicle', 'plate_no', 'avg_consumption'])
            ->orderBy('vehicle')
            ->get();

        $reasons = $conn2->table('travel_order_prioritizations')
            ->select(['id as value', 'reason as label'])
            ->orderBy('reason')
            ->get();

        $serviceExpenses = $conn2->table('travel_order_service_expenses as se')
            ->select([
                'se.id',
                'se.travel_order_id',
                'se.driver',
                'se.vehicle_id',
                'se.total_km',
                'se.total_gas',
                'se.gas_price',
                'se.toll_fee',
                'se.tev',
                'v.vehicle as vehicle_name',
                'v.plate_no',
                'v.avg_consumption',
            ])
            ->leftJoin('travel_order_vehicles as v', 'se.vehicle_id', '=', 'v.id')
            ->where('se.travel_order_id', $id)
            ->get();

        $pruReview = $conn2->table('travel_order_review')
            ->where('travel_order_id', $id)
            ->first();

        $dispatcherId = $pruReview?->dispatcher ?? null;

        $collectEmpIds = function (...$values) {
            return collect($values)
                ->flatten()
                ->filter(fn ($v) => $v !== null && $v !== '')
                ->map(fn ($v) => (string) $v)
                ->unique()
                ->values();
        };

        $staffEmpIds = collect($staffRows)->flatMap(fn ($s) => [
            $s->emp_id,
            $s->recommender_id,
            $s->approver_id,
        ]);

        $driverIds = collect($serviceExpenses)->pluck('driver');

        $empIds = $collectEmpIds(
            $order->created_by,
            $order->approver_id,
            $latestHistory?->acted_by,
            $latestVehicleRequestHistory?->acted_by,
            $staffEmpIds,
            $driverIds,
            $dispatcherId
        );

        $employeesById = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw("
                    CONCAT(
                        lname, ', ',
                        fname,
                        IF(mname IS NOT NULL AND mname != '',
                            CONCAT(' ', LEFT(mname, 1), '.'),
                            ''
                        )
                    ) as name
                "),
                'division_id',
            ])
            ->whereIn('emp_id', $empIds)
            ->get()
            ->keyBy(fn ($row) => (string) $row->emp_id);

        $empName = function ($id) use ($employeesById) {
            $key = (string) ($id ?? '');
            if ($key === '') return null;
            return isset($employeesById[$key]) ? trim($employeesById[$key]->name) : null;
        };

        $staffs = $staffRows->map(function ($s) use ($empName) {
            return [
                'id' => (int) $s->id,
                'emp_id' => (string) $s->emp_id,
                'name' => $empName($s->emp_id),
                'recommender_id' => $s->recommender_id ? (string) $s->recommender_id : null,
                'recommender_name' => $empName($s->recommender_id),
                'approver_id' => $s->approver_id ? (string) $s->approver_id : null,
                'approver_name' => $empName($s->approver_id),
            ];
        })->values();

        $serviceExpenses = $serviceExpenses->map(function ($se) use ($empName) {
            $se->driver_name = $empName($se->driver);
            return $se;
        });

        if ($pruReview) {
            $pruReview->dispatcher_name = $empName($dispatcherId);
        }

        $travelOrder = [
            'id' => (int) $order->id,
            'reference_no' => $order->reference_no,
            'category_title' => $order->category_title,
            'fund_source_title' => $order->fund_source_title,

            'start_date' => $order->start_date,
            'end_date' => $order->end_date,
            'purpose' => $order->purpose,

            'created_by' => $order->created_by,
            'creator' => $empName($order->created_by),

            'other_passengers' => $order->other_passengers,
            'other_vehicles' => $order->other_vehicles,
            'other_drivers' => $order->other_drivers,
            'isRequestingVehicle' => (bool) $order->isRequestingVehicle,
            'date_created' => $order->date_created,

            'staffs' => $staffs,
            'destinations' => $destinations,
            'commutation_expenses' => $commutation_expenses,

            'status' => $latestHistory?->status,
            'acted_by' => $latestHistory?->acted_by,
            'acted_by_name' => $empName($latestHistory?->acted_by),
            'remarks' => $latestHistory?->remarks,
            'date_acted' => $latestHistory?->date_acted,

            'vehicle_request_status' => $latestVehicleRequestHistory?->status,
            'vehicle_request_acted_by' => $latestVehicleRequestHistory?->acted_by,
            'vehicle_request_acted_by_name' => $empName($latestVehicleRequestHistory?->acted_by),
            'vehicle_request_remarks' => $latestVehicleRequestHistory?->remarks,
            'vehicle_request_date_acted' => $latestVehicleRequestHistory?->date_acted,

            'est_distance' => $order->est_distance,
            'est_departure_time' => $order->est_departure_time,
            'est_arrival_time' => $order->est_arrival_time,

            'review' => $pruReview
        ];

        return Inertia::render('TravelOrders/View', [
            'travelOrder' => $travelOrder,
            'vehicles' => $vehicles,
            'serviceExpenses' => $serviceExpenses,
            'reasons' => $reasons,
            'can' => [
                'edit' => $canEdit->allowed(),
                'delete' => $canDelete->allowed(),
                'view' => $canView->allowed(),
                'submit' => $canSubmit->allowed(),
                'endorse' => $canEndorse->allowed(),
                'approve' => $canApprove->allowed(),
                'review' => $canReview->allowed(),
                'authorize' => $canAuthorize->allowed(),
                'disapprove' => $canDisapprove->allowed(),
                'return' => $canReturn->allowed(),
            ],
        ]);
    }

    public function destroy($id)
    {
        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $conn2->table('travel_order')
                ->where('id', $id)
                ->delete();

            $conn2->table('submission_history')
                ->where('model_id', $id)
                ->where('model', 'TO')
                ->delete();

            $conn2->commit();

            return redirect()->route('travel-requests.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Travel order deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to delete travel order: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the travel order. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $ids = $request->input('ids');

        try {

            $conn2->beginTransaction();

            $conn2->table('travel_order')
                ->whereIn('id', $ids)
                ->delete();

            $conn2->table('submission_history')
                ->whereIn('model_id', $ids)
                ->where('model', 'TO')
                ->delete();

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Travel orders deleted successfully.'
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to delete travel orders: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the travel orders. Please try again.'
            ]);
        }
    }

    public function submit($id)
    {

        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try {

            $conn2->beginTransaction();

            $travelOrder = $conn2->table('travel_order')
            ->where('id', $id)
            ->lockForUpdate()
            ->first();

            if (!$travelOrder) {
                $conn2->rollBack();
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Travel order record not found.',
                ]);
            }

            $conn2->table('submission_history')->insert([
                'model' => 'TO',
                'model_id' => $id,
                'status' => 'Submitted',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            if((int) $travelOrder->isRequestingVehicle === 1){

                $vehicleRequest = VehicleRequest::query()
                ->whereKey($id)
                ->lockForUpdate()
                ->first();

                if (!$vehicleRequest) {
                    $conn2->rollBack();
                    return redirect()->back()->with([
                        'status' => 'error',
                        'title' => 'Not Found',
                        'message' => 'Vehicle request record not found.',
                    ]);
                }
                
                $employee = $conn3->table('tblemployee')
                    ->select(['division_id'])
                    ->where('emp_id', $travelOrder->created_by)
                    ->first();

                $divisionId = $employee?->division_id ?? $travelOrder->division ?? null;

                $approverId = $conn2->table('travel_order_signatories')
                ->where('type', 'Approver_VR')
                ->when($divisionId, fn ($q) => $q->where('division', $divisionId))
                ->value('signatory');

                $recommenderId = $conn2->table('travel_order_signatories')
                ->where('type', 'Recommending_VR')
                ->when($divisionId, fn ($q) => $q->where('division', $divisionId))
                ->value('signatory');
                
                $actor = (string) auth()->user()->ipms_id;
                $creatorId = (string) $travelOrder->created_by;

                if ($vehicleRequest->state instanceof VrDraft) {
                    $vehicleRequest->state->transitionTo(
                        VrSubmitted::class,
                        actedBy: $actor
                    );
                    $vehicleRequest->refresh();
                }

                if ($approverId && $creatorId === (string) $approverId) {
                    if ($vehicleRequest->state instanceof VrSubmitted) {
                        $vehicleRequest->state->transitionTo(
                            VrEndorsed::class,
                            actedBy: $actor
                        );
                        $vehicleRequest->refresh();
                    }

                    if ($vehicleRequest->state instanceof VrEndorsed) {
                        $vehicleRequest->state->transitionTo(
                            VrApproved::class,
                            actedBy: $actor
                        );
                        $vehicleRequest->refresh();
                    }
                } elseif ($recommenderId && $creatorId === (string) $recommenderId) {
                    if ($vehicleRequest->state instanceof VrSubmitted) {
                        $vehicleRequest->state->transitionTo(
                            VrEndorsed::class,
                            actedBy: $actor
                        );
                        $vehicleRequest->refresh();
                    }
                }
            }

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Submitted',
                'message' => 'Travel request submitted successfully.'
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error submitting TO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while submitting TO. Please try again.'
            ]);
        }
    }
    
    public function generate($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $order = $conn2->table('travel_order')
        ->select([
            'travel_order.id',
            'reference_no',
            'travel_category_id',
            'start_date',
            'end_date',
            'purpose',
            'fund_source_id',
            'other_passengers',
            'other_vehicles',
            'other_drivers',
            'isRequestingVehicle',
            'created_by',
            'date_created',
            'travel_order_categories.title as category_title',
            'travel_order_fund_sources.title as fund_source_title',
            'approver_id',
        ])
        ->leftJoin('travel_order_categories', 'travel_order.travel_category_id', '=', 'travel_order_categories.id')
        ->leftJoin('travel_order_fund_sources', 'travel_order.fund_source_id', '=', 'travel_order_fund_sources.id')
        ->where('travel_order.id', $id)
        ->first();
        
        if (!$order) {
            return redirect()->route('travel-requests.index')->with([
                'status' => 'error',
                'title' => 'Not found',
                'message' => 'Travel request not found.',
            ]);
        }

        $latestHistory = $conn2->table('submission_history')
        ->where('model', 'TO')
        ->where('model_id', $id)
        ->orderBy('date_acted', 'desc')
        ->first();

        $staffRows = $conn2->table('travel_order_staffs')
            ->select(['id', 'emp_id', 'recommender_id', 'approver_id'])
            ->where('travel_order_id', $id)
            ->get();

        $empIds = collect($staffRows)
        ->flatMap(function ($s) {
            return [
                $s->emp_id,
                $s->recommender_id,
                $s->approver_id,
            ];
        })
        ->push($order->created_by)
        ->when($latestHistory?->acted_by, fn ($c) => $c->push($latestHistory->acted_by))
        ->filter(fn ($v) => $v !== null && $v !== '')
        ->unique()
        ->values();

        $employeesById = $conn3->table('tblemployee')
        ->select([
            'emp_id',
            DB::raw("
                CONCAT(
                    fname,
                    ' ',
                    IF(mname IS NOT NULL AND mname != '',
                        CONCAT(LEFT(mname,1), '. '),
                        ''
                    ),
                    lname
                ) as name
            "),
            'division_id',
        ])
        ->whereIn('emp_id', $empIds)
        ->get()
        ->keyBy('emp_id');

        $empName = function ($id) use ($employeesById) {
            if (!$id) return null;
            $row = $employeesById->get($id);
            return $row?->name ? trim($row->name) : null;
        };

        $creatorName = $order->created_by
        ? trim(optional($employeesById->get($order->created_by))->name)
        : null;

        $staffs = $staffRows
        ->map(function ($s) use ($empName) {
            return [
                'id' => (int) $s->id,

                'emp_id' => (string) $s->emp_id,
                'name' => $empName($s->emp_id),

                'recommender_id' => $s->recommender_id ? (string) $s->recommender_id : null,
                'recommender_name' => $empName($s->recommender_id),

                'approver_id' => $s->approver_id ? (string) $s->approver_id : null,
                'approver_name' => $empName($s->approver_id),
            ];
        })
        ->values();

        $destinations = $conn2->table('travel_order_destinations')
            ->where('travel_order_id', $id)
            ->get();

        $commutation_expenses = $conn2->table('travel_order_expenses')
            ->where('travel_order_id', $id)
            ->get();

        $travelOrder = [
            'id' => (int) $order->id,
            'reference_no' => $order->reference_no,
            'category_title' => $order->category_title,
            'fund_source_title' => $order->fund_source_title,
            'dates' => DateRange::display($order->start_date, $order->end_date),
            'purpose' => $order->purpose,
            'created_by' => $order->created_by,
            'creator' => $creatorName,
            'date_created' => Carbon::parse($order->date_created)->format('F j, Y'),
            'staffs' => $staffs,
            'destinations' => $destinations,
        ];

        $today = now()->format('YmdHis');
        $toDate = Carbon::parse($order->date_created)->format('F_d_Y');

        return view('reports.to', [
            'travelOrder' => $travelOrder,
        ]);

        /* $pdf = Pdf::loadView('reports.to', [
            'travelOrder' => $travelOrder,
        ])->setPaper('a4', 'landscape');

        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'dpi' => 96,                
            'defaultFont' => 'Arial',
        ]);
 */
        return $pdf->stream("{$today}_TO_{$toDate}.pdf");
    }

}