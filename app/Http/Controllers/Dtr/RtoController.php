<?php

namespace App\Http\Controllers\Dtr;

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
use App\Notifications\CompetenciesForReviewSubmitted;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use App\Notifications\NotifyArdOfRtoEndorsement;
use App\Notifications\NotifyStaffOfRtoApproval;
use Barryvdh\DomPDF\Facade\Pdf;


class RtoController extends Controller
{
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2'); 
        $conn3 = DB::connection('mysql3'); 

        $sort      = $request->get('sort');
        $direction = $request->get('direction', 'asc');
        $search    = $request->input('search');

        $rolePriorities = config('roles.priorities');

        $userRoles = Auth::user()->roles->pluck('name')->toArray();
        $highestRole = collect($userRoles)
            ->mapWithKeys(fn($role) => [$role => $rolePriorities[$role] ?? 0])
            ->sortDesc()
            ->keys()
            ->first();

        /**
         * 1. Employees for listing (filtered)
         */
        $employeesQuery = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw('concat(lname, ", ", fname, " ", mname) as name'),
                'division_id'
            ])
            ->where('work_status', 'active')
            ->orderBy('lname')
            ->orderBy('fname')
            ->orderBy('mname');

        switch ($highestRole) {
            case 'HRIS_RD':
                // RD sees all
                break;
            case 'HRIS_ARD':
                // ARD sees all
                break;
            case 'HRIS_HR':
                // HR sees all
                break;
            case 'HRIS_ADC':
            case 'HRIS_DC':
                $employeesQuery->where('division_id', Auth::user()->division);
                break;
            case 'HRIS_Staff':
                $employeesQuery->where('emp_id', Auth::user()->ipms_id);
                break;
        }

        $employees = $employeesQuery->get()->keyBy('emp_id');
        $employeeIds = $employees->keys()->all();

        /**
         * 2. Separate query: ALL employees (for acted_by lookup)
         */
        $allEmployees = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw('concat(lname, ", ", fname, " ", mname) as name')
            ])
            ->get()
            ->keyBy('emp_id');

        /**
         * 3. Get flexi_rto records
         */
        $targetsQuery = $conn2->table('flexi_rto')
            ->whereIn('emp_id', $employeeIds)
            ->when($request->filled('emp_id'), fn($q) => $q->where('emp_id', $request->emp_id))
            ->when($request->filled('date'), fn($q) => $q->whereDate('date', Carbon::parse($request->date)->format('Y-m-d')))
            ->orderBy('date', 'desc');

        $targets = $targetsQuery->paginate(20);
        $targetIds = $targets->pluck('id')->all();

        /**
         * 4. Histories
         */
        $histories = $conn2->table('submission_history')
            ->where('model', 'RTO')
            ->whereIn('model_id', $targetIds)
            ->orderBy('date_acted', 'desc')
            ->get()
            ->groupBy('model_id');

        /**
         * 5. Outputs
         */
        $outputs = $conn2->table('flexi_target')
            ->whereIn('rto_id', $targetIds)
            ->get()
            ->groupBy('rto_id');

        /**
         * 6. Transform Data
         */
        $targets->getCollection()->transform(function ($item) use ($employees, $allEmployees, $histories, $outputs) {
            $item->employee_name = $employees[$item->emp_id]->name ?? null;

            $latestHistory = $histories[$item->id][0] ?? null;
            if ($latestHistory) {
                $item->status        = $latestHistory->status;
                $item->acted_by      = $latestHistory->acted_by;
                $item->acted_by_name = $allEmployees[$latestHistory->acted_by]->name ?? null; // 🔹 Use full list
                $item->remarks       = $latestHistory->remarks;
                $item->date_acted    = $latestHistory->date_acted;
            } else {
                $item->status        = null;
                $item->acted_by      = null;
                $item->acted_by_name = null;
                $item->remarks       = null;
                $item->date_acted    = null;
            }

            $item->isLocked = !(
                $item->emp_id == auth()->user()->ipms_id &&
                (!$item->status || !in_array($item->status, ["Endorsed", "Approved", "Disapproved", "Submitted"]))
            );

            $item->outputs = $outputs[$item->id] ?? [];

            return $item;
        });

        /**
         * 7. Fridays for Date Picker
         */
        $fridays = [];
        $now = Carbon::now();
        $months = [
            Carbon::createFromDate($now->year, $now->month, 1)->subMonth(),
            Carbon::createFromDate($now->year, $now->month, 1),
            Carbon::createFromDate($now->year, $now->month, 1)->addMonth(),
        ];

        foreach ($months as $monthDate) {
            $date = $monthDate->copy()->startOfMonth();
            $lastDay = $monthDate->copy()->endOfMonth();
            while ($date->lte($lastDay)) {
                if ($date->isFriday()) $fridays[] = $date->format('Y-m-d');
                $date->addDay();
            }
        }

        return Inertia::render('Dtr/Rto/index', [
            'data' => [
                'employees' => $employees->map(fn($emp) => [
                    'value' => $emp->emp_id,
                    'label' => $emp->name
                ])->values(),
                'dates'     => $fridays,
                'targets'   => $targets,
                'filters'   => $request->only(['employee', 'date', 'sort', 'direction', 'search']),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $user  = auth()->user();

        $rules = [
            'date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) use ($request, $conn2, $user) {
                    $empId = $user->hasAnyRole(['HRIS_HR', 'HRIS_DC', 'HRIS_ADC'])
                        ? $request->input('emp_id')
                        : $user->ipms_id;

                    if ($empId && $conn2->table('flexi_rto')
                            ->where('emp_id', $empId)
                            ->where('date', $value)
                            ->exists()) {
                        $fail('An RTO entry already exists for this employee on the selected date.');
                    }
                },
            ],
            'type'               => ['required', 'string'],
            'outputs'             => ['required', 'array', 'min:1'],
            'outputs.*.output'    => ['required', 'string'],
            'other_type'         => ['required_if:type,Other', 'nullable', 'string'],
        ];

        if ($user->hasAnyRole(['HRIS_HR', 'HRIS_DC', 'HRIS_ADC'])) {
            $rules['emp_id'] = ['required'];
        }

        $validated = $request->validate($rules, [
            'emp_id.required'           => 'Please select an employee.',
            'date.required'             => 'The date is required.',
            'type.required'             => 'The flexiplace type is required.',
            'other_type.required_if'    => 'Please specify the place.',
            'outputs.required'          => 'At least one target output is required.',
            'outputs.min'               => 'Please input at least one target output.',
            'outputs.*.output.required' => 'Each target output must not be empty.',
        ]);

        if (!$user->hasAnyRole(['HRIS_HR', 'HRIS_DC', 'HRIS_ADC'])) {
            $validated['emp_id'] = $user->ipms_id;
        }

        $conn2->beginTransaction();

        try {
            $rtoId = $conn2->table('flexi_rto')->insertGetId([
                'emp_id'     => $validated['emp_id'],
                'date'       => $validated['date'],
                'type'       => $validated['type'],
                'other_type' => $validated['type'] === 'Other' ? $validated['other_type'] : null,
                'created_by' => $user->ipms_id,
                'created_at' => now(),
            ]);

            foreach ($validated['outputs'] as $out) {
                $conn2->table('flexi_target')->insert([
                    'rto_id'     => $rtoId,
                    'emp_id'     => $validated['emp_id'],
                    'date'       => $validated['date'],
                    'output'     => $out['output'],
                    'created_by' => $user->ipms_id,
                    'created_at' => now(),
                ]);
            }

            $conn2->table('submission_history')->insert([
                'model'      => 'RTO',
                'model_id'   => $rtoId,
                'status'     => 'Draft',
                'acted_by'   => $user->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

            return back()->with([
                'status'  => 'success',
                'title'   => 'Success!',
                'message' => 'Target outputs saved successfully.',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Store Error: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while saving target outputs.',
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $conn2 = DB::connection('mysql2');
        $user  = auth()->user();

        $rules = [
        'date' => [
            'required',
            'date',
            function ($attribute, $value, $fail) use ($request, $conn2, $user, $id) {
                $empId = $user->hasAnyRole(['HRIS_HR', 'HRIS_DC', 'HRIS_ADC'])
                    ? $request->input('emp_id')
                    : $user->ipms_id;

                if ($empId && $conn2->table('flexi_rto')
                        ->where('emp_id', $empId)
                        ->where('date', $value)
                        ->where('id', '<>', $id) // exclude current record
                        ->exists()) {
                    $fail('An RTO entry already exists for this employee on the selected date.');
                }
            },
        ],
        'type'               => ['required', 'string'],
        'outputs'            => ['required', 'array', 'min:1'],
        'outputs.*.output'   => ['required', 'string'],
        'other_type'         => ['required_if:type,Other', 'nullable', 'string'],
        'removedOutputs'     => ['array'],
        ];

        if ($user->hasAnyRole(['HRIS_HR', 'HRIS_DC', 'HRIS_ADC'])) {
            $rules['emp_id'] = ['required'];
        }

        $validated = $request->validate($rules, [
            'emp_id.required'           => 'Please select an employee.',
            'date.required'             => 'The date is required.',
            'type.required'             => 'The flexiplace type is required.',
            'other_type.required_if'    => 'Please specify the place.',
            'outputs.required'          => 'At least one target output is required.',
            'outputs.min'               => 'Please input at least one target output.',
            'outputs.*.output.required' => 'Each target output must not be empty.',
        ]);

        if (!$user->hasAnyRole(['HRIS_HR', 'HRIS_DC', 'HRIS_ADC'])) {
            $validated['emp_id'] = $user->ipms_id;
        }

        $conn2->beginTransaction();

        try {
            // fetch old record before update
            $rto = $conn2->table('flexi_rto')->where('id', $id)->first();

            $conn2->table('flexi_rto')
                ->where('id', $id)
                ->update([
                    'emp_id'     => $validated['emp_id'],
                    'date'       => $validated['date'],
                    'type'       => $validated['type'],
                    'other_type' => $validated['type'] === 'Other' ? $validated['other_type'] : null,
                    'updated_by' => $user->ipms_id,
                    'updated_at' => now(),
                ]);

            if (!empty($validated['removedOutputs'])) {
                $conn2->table('flexi_target')
                    ->whereIn('id', $validated['removedOutputs'])
                    ->delete();
            }

            // Insert or update
            foreach ($request->outputs as $out) {
                if (!is_null($out['id'])) {
                    $conn2->table('flexi_target')
                        ->where('id', $out['id'])
                        ->update([
                            'output'     => $out['output'],
                            'date'       => $validated['date'],
                            'created_by' => $user->ipms_id,
                            'created_at' => now(),
                        ]);
                } else {
                    $conn2->table('flexi_target')->insert([
                        'rto_id'     => $rto->id,
                        'emp_id'     => $validated['emp_id'],
                        'date'       => $validated['date'],
                        'output'     => $out['output'],
                        'created_by' => $user->ipms_id,
                        'created_at' => now(),
                    ]);
                }
            }

            $conn2->commit();

            return back()->with([
                'status'  => 'success',
                'title'   => 'Updated!',
                'message' => 'Target outputs updated successfully.',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Update Error: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while updating target outputs.',
            ]);
        }
    }

    public function destroy(string $id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->table('flexi_rto')
                ->where('id', $id)
                ->delete();

            $conn2->table('flexi_target')
                ->where('rto_id', $id)
                ->delete();

            $conn2->table('flexi_accomplishment')
                ->where('rto_id', $id)
                ->delete();

            $conn2->table('submission_history')
                ->where('model', 'RTO')
                ->where('model_id', $id)
                ->delete();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Deleted!',
                'message' => 'RTO has been deleted successfully.'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting RTO. Please try again.'
            ]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {

            $conn2->table('flexi_rto')
            ->whereIn('id', $request->input('ids'))
            ->delete();

            $conn2->table('flexi_target')
            ->whereIn('rto_id', $request->input('ids'))
            ->delete();

            $conn2->table('flexi_accomplishment')
            ->whereIn('rto_id', $request->input('ids'))
            ->delete();

            $conn2->table('submission_history')
            ->where('model', 'RTO')
            ->whereIn('model_id', $request->input('ids'))
            ->delete();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Deleted!',
                'message' => 'Selected RTO have been deleted successfully.'
            ]);

        } catch (\Exception $e) {
            Log::error('Error bulk deleting RTOs: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting RTOs. Please try again.'
            ]);
        }
    }

    public function submit($id)
    {

        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $rto = $conn2->table('flexi_rto')->where('id', $id)->first();

            if (!$rto) {
                abort(404, 'RTO not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RTO',
                'model_id' => $id,
                'status' => 'Submitted',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error submitting RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while submitting RTO. Please try again.'
            ]);
        }
    }

    public function endorse($id)
    {

        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $rto = $conn2->table('flexi_rto')->where('id', $id)->first();

            if (!$rto) {
                abort(404, 'RTO not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RTO',
                'model_id' => $id,
                'status' => 'Endorsed',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error endorsing RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while endorsing RTO. Please try again.'
            ]);
        }
    }

    public function endorseViaEmail($token)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');

        try {

            $link = $conn4->table('email_links')->where('token', $token)->first();
            
            if (!$link) {
                abort(404, 'Invalid link.');
            }

            if (now()->greaterThan($link->expires_at)) {
                return Inertia::render('ThankYou', [
                    'message' => 'This link has expired.'
                ]);
            }

            if ($link->is_used) {
                return Inertia::render('ThankYou', [
                    'message' => 'This link has already been used.'
                ]);
            }
            
            $rto = $conn2->table('flexi_rto')->where('id', $link->model_id)->first();

            if (!$rto) {
                abort(404, 'RTO not found');
            }

            $user = User::find($link->user_id);

            if (!$user) {
                abort(404, 'User not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RTO',
                'model_id' => $rto->id,
                'status' => 'Endorsed',
                'acted_by' => $user->ipms_id,
                'date_acted' => now(),
            ]);

            $conn4->table('email_links')
            ->where('token', $token)
            ->update(['is_used' => true]);

            // Audit log (optional)
            Log::info("RTO {$rto->id} endorsed via email by user {$user->email}");

            $ard = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_ARD']);
            })->get();

            if ($ard->isEmpty()) {

                Log::warning("No ARD users found for endorsement notification.");

            } else {

                $submitter = User::where('ipms_id', $rto->emp_id)->first();

                if ($submitter) {
                    $payload = [
                        'rto_id' => $rto->id,
                        'submitter_email' => $submitter->email,
                        'endorser_id' => $user->ipms_id,
                    ];

                    Notification::send($ard, new NotifyArdOfRtoEndorsement($payload));
                }
            }

            return Inertia::render('ThankYou', [
                'message' => 'You have successfully endorsed the RTO.',
            ]);

        } catch (\Exception $e) {
            Log::error("Failed email endorsement for RTO: " . $e->getMessage());
            
            return Inertia::render('ThankYou', [
                'message' => 'Something went wrong. Please contact the ICT Unit.',
            ]);
        }
    }

    public function approve($id)
    {

        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $rto = $conn2->table('flexi_rto')->where('id', $id)->first();

            if (!$rto) {
                abort(404, 'RTO not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RTO',
                'model_id' => $id,
                'status' => 'Approved',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);
            
            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error approving RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while approving RTO. Please try again.'
            ]);
        }
    }

    public function approveViaEmail($token)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');

        try {

            $link = $conn4->table('email_links')->where('token', $token)->first();
            
            if (!$link) {
                abort(404, 'Invalid link.');
            }

            if (now()->greaterThan($link->expires_at)) {
                return Inertia::render('ThankYou', [
                    'message' => 'This link has expired.'
                ]);
            }

            if ($link->is_used) {
                return Inertia::render('ThankYou', [
                    'message' => 'This link has already been used.'
                ]);
            }
            
            $rto = $conn2->table('flexi_rto')->where('id', $link->model_id)->first();

            if (!$rto) {
                abort(404, 'RTO not found');
            }

            $user = User::find($link->user_id);

            if (!$rto) {
                abort(404, 'User not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RTO',
                'model_id' => $rto->id,
                'status' => 'Approved',
                'acted_by' => $user->ipms_id,
                'date_acted' => now(),
            ]);

            $conn4->table('email_links')
            ->where('token', $token)
            ->update(['is_used' => true]);


            $staff = $conn3->table('tblemployee')
            ->where('emp_id', $rto->emp_id)
            ->first();

            if (!$staff) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Staff record not found.'
                ]);
            }

            $supervisors = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_ADC', 'HRIS_DC']);
            })
            ->where('division', $staff->division_id)
            ->get();

            if ($supervisors->isEmpty()) {
                Log::warning("No supervisors found for division: {$staff->division_id}");
            }

            $submitter = User::where('ipms_id', $rto->emp_id)->first();

            if ($submitter) {
                $payload = [
                    'rto_id' => $rto->id,
                    'approver_id' => $user->ipms_id,
                    'supervisor_emails' => $supervisors->pluck('email')->toArray(),
                ];

                Notification::send($submitter, new NotifyStaffOfRtoApproval($payload));
            }

            // Audit log (optional)
            Log::info("RTO {$rto->id} approved via email by user {$user->email}");

            return Inertia::render('ThankYou', [
                'message' => 'You have successfully approved the RTO.',
            ]);

        } catch (\Exception $e) {
            Log::error("Failed email approval for RTO: " . $e->getMessage());
            
            return Inertia::render('ThankYou', [
                'message' => 'Something went wrong. Please contact the ICT Unit.',
            ]);
        }
    }

    public function disapprove($id, Request $request)
    {

        $conn2 = DB::connection('mysql2');

        $request->validate(
            [
                'remarks' => 'required|string|max:1000',
            ],
            [
                'remarks.required' => 'Remarks are required to disapprove an RTO.',
                'remarks.string'   => 'Remarks must be a valid text.',
                'remarks.max'      => 'Remarks cannot exceed 1000 characters.',
            ]
        );

        try {

            $conn2->beginTransaction();

            $rto = $conn2->table('flexi_rto')->where('id', $id)->first();

            if (!$rto) {
                abort(404, 'RTO not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RTO',
                'model_id' => $id,
                'status' => 'Disapproved',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
                'remarks' => $request->remarks
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error disapproving RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while disapproving RTO. Please try again.'
            ]);
        }
    }

    public function return($id, Request $request)
    {

        $conn2 = DB::connection('mysql2');

        $request->validate(
            [
                'remarks' => 'required|string|max:1000',
            ],
            [
                'remarks.required' => 'Remarks are required to return an RTO.',
                'remarks.string'   => 'Remarks must be a valid text.',
                'remarks.max'      => 'Remarks cannot exceed 1000 characters.',
            ]
        );

        try {

            $conn2->beginTransaction();

            $rto = $conn2->table('flexi_rto')->where('id', $id)->first();

            if (!$rto) {
                abort(404, 'RTO not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RTO',
                'model_id' => $id,
                'status' => 'Needs Revision',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
                'remarks' => $request->remarks
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error returning RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while returning RTO. Please try again.'
            ]);
        }
    }
    
    public function generate($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');

        $getSignature = function ($binary) {
            if (!$binary) return null;
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_buffer($finfo, $binary);
            finfo_close($finfo);
            return 'data:' . $mimeType . ';base64,' . base64_encode($binary);
        };

        // Fetch RTO record
        $rto = $conn2->table('flexi_rto')->where('id', $id)->first();
        if (!$rto) abort(404, 'RTO not found');

        // Fetch employee info separately
        $employee = $conn3->table('tblemployee')
            ->select(['emp_id', DB::raw("CONCAT(fname,' ', IF(mname IS NOT NULL AND mname != '', CONCAT(LEFT(mname,1),'. '),'') , lname) as name"), 'division_id'])
            ->where('emp_id', $rto->emp_id)
            ->first();

        $rto->name = $employee->name ?? null;
        $rto->division_id   = $employee->division_id ?? null;

        // Fetch outputs
        $outputs = $conn2->table('flexi_target')
            ->where('rto_id', $rto->id)
            ->pluck('output');

        // Current RTO status
        $currentStatus = $conn2->table('submission_history')
            ->where('model', 'RTO')
            ->where('model_id', $rto->id)
            ->orderByDesc('date_acted')
            ->first()?->status;

        // -------------------
        // Supervisor Info
        // -------------------
        $endorser = $conn2->table('submission_history')
            ->where('model', 'RTO')
            ->where('model_id', $rto->id)
            ->where('status', 'Endorsed')
            ->orderByDesc('date_acted')
            ->first();

        $dcUser = User::role('HRIS_DC')->where('division', $rto->division_id)->first();
        $supervisorEmpId = $endorser->acted_by ?? $dcUser->ipms_id ?? null;

        $supervisorInfo = $supervisorEmpId
            ? $conn3->table('tblemployee')
                ->select(['emp_id', DB::raw("CONCAT(fname,' ', IF(mname IS NOT NULL AND mname != '', CONCAT(LEFT(mname,1),'. '),'') , lname) as name"), 'division_id'])
                ->where('work_status', 'active')
                ->where('emp_id', $supervisorEmpId)
                ->first()
            : null;

        $supervisorSignature = null;
        if ($supervisorEmpId && in_array($currentStatus, ['Endorsed', 'Approved'])) {
            $supervisor = $conn4->table('users')->where('ipms_id', $supervisorEmpId)->first();
            $supervisorSignature = $supervisor ? $getSignature($supervisor->signature) : null;
        }

        // -------------------
        // Approver Info
        // -------------------
        $approverInfo = $conn2->table('submission_history')
            ->where(['model' => 'RTO', 'model_id' => $rto->id, 'status' => 'Approved'])
            ->orderByDesc('date_acted')
            ->first();

        if ($approverInfo) {
            $approverEmp = $conn3->table('tblemployee')
                ->select(['emp_id', DB::raw("CONCAT(fname,' ', IF(mname IS NOT NULL AND mname != '', CONCAT(LEFT(mname,1),'. '),'') , lname) as name"), 'division_id'])
                ->where('emp_id', $approverInfo->acted_by)
                ->where('work_status', 'active')
                ->first();

            $approverName = $approverEmp->name ?? null;

            $approverPosition = $conn3->table('tblemp_emp_item as eei')
                ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
                ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
                ->where('eei.emp_id', $approverInfo->acted_by)
                ->whereNull('eei.to_date')
                ->orderByDesc('eei.from_date')
                ->value('p.post_description');

            $approverSignature = $conn4->table('users')->where('ipms_id', $approverInfo->acted_by)->first();
            $approverSignature = $approverSignature ? $getSignature($approverSignature->signature) : null;
        } else {
            $approverName     = $conn2->table('settings')->where('title', 'Agency Sub-Head')->value('value');
            $approverPosition = $conn2->table('settings')->where('title', 'Agency Sub-Head Position')->value('value');
            $approverSignature = null;
        }

        // -------------------
        // Creator Info
        // -------------------
        $creator = $conn4->table('users')->where('ipms_id', $rto->emp_id)->first();
        $creatorSignature = $creator ? $getSignature($creator->signature) : null;

        $creatorPosition = $conn3->table('tblemp_emp_item as eei')
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->select(['p.post_description as position'])
            ->where('eei.emp_id', $rto->emp_id)
            ->whereNull('eei.to_date')
            ->orderByDesc('eei.from_date')
            ->first();

        $today = now()->format('YmdHis');
        $rtoDate = Carbon::parse($rto->date)->format('F_d_Y');

        $pdf = Pdf::loadView('reports.rto', [
            'rto'                => $rto,
            'position'           => $creatorPosition,
            'outputs'            => $outputs,
            'date'               => $today,
            'supervisorName'     => $supervisorInfo->name ?? '',
            'approverName'       => $approverName,
            'approverPosition'   => $approverPosition,
            'creatorSignature'   => $creatorSignature,
            'supervisorSignature'=> $supervisorSignature,
            'approverSignature'  => $approverSignature,
        ]);

        return $pdf->download("{$today}_RTO_{$rtoDate}.pdf");
    }
}
