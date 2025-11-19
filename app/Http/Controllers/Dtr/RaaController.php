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
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use App\Notifications\NotifyArdOfRaaEndorsement;
use App\Notifications\NotifyStaffOfRaaApproval;
use Barryvdh\DomPDF\Facade\Pdf;
use TCPDF;


class RaaController extends Controller
{
    public function index(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $sort      = $request->get('sort');
        $direction = $request->get('direction', 'asc');
        $search    = $request->input('search');

        $sortable = [
            'employee_name' => DB::raw('employee_name'),
            'status'        => DB::raw('raa_status'),       
            'date'          => 'rto.date',               
        ];

        $rolePriorities = config('roles.priorities');

        $userRoles = Auth::user()->roles->pluck('name')->toArray();
        $highestRole = collect($userRoles)
            ->mapWithKeys(fn($role) => [$role => $rolePriorities[$role] ?? 0])
            ->sortDesc()
            ->keys()
            ->first();

        // Employees (for dropdown filter)
        $employeesQuery = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw('concat(lname, ", ", fname, " ", mname) as name'),
                'division_id',
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

        $allEmployees = $conn3->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw('concat(lname, ", ", fname, " ", mname) as name')
            ])
            ->get()
            ->keyBy('emp_id');

        $latestHistoryRTO = DB::raw("(SELECT sh1.* 
            FROM submission_history sh1 
            INNER JOIN (
                SELECT model_id, MAX(date_acted) as latest_date 
                FROM submission_history 
                WHERE model = 'RTO' 
                GROUP BY model_id
            ) sh2 
            ON sh1.model_id = sh2.model_id AND sh1.date_acted = sh2.latest_date 
            WHERE sh1.model = 'RTO'
        ) as sh_rto");

        $latestHistoryRAA = DB::raw("(SELECT sh1.* 
            FROM submission_history sh1 
            INNER JOIN (
                SELECT model_id, MAX(date_acted) as latest_date 
                FROM submission_history 
                WHERE model = 'RAA' 
                GROUP BY model_id
            ) sh2 
            ON sh1.model_id = sh2.model_id AND sh1.date_acted = sh2.latest_date 
            WHERE sh1.model = 'RAA'
        ) as sh_raa");

        $targetsQuery = $conn2->table('flexi_rto as rto')
            ->leftJoin($latestHistoryRTO, 'sh_rto.model_id', '=', 'rto.id')
            ->leftJoin('flexi_raa as raa', 'raa.rto_id', '=', 'rto.id')
            ->leftJoin($latestHistoryRAA, 'sh_raa.model_id', '=', 'raa.id')
            ->select([
                'rto.*',
                'sh_rto.status as rto_status',
                'sh_rto.acted_by as rto_acted_by',
                'sh_rto.remarks as rto_remarks',
                'sh_rto.date_acted as rto_date_acted',
                'sh_raa.status as raa_status',
                'sh_raa.acted_by as raa_acted_by',
                'sh_raa.remarks as raa_remarks',
                'sh_raa.date_acted as raa_date_acted',
                DB::raw('(
                    CASE 
                        WHEN rto.emp_id = "'.auth()->user()->ipms_id.'" 
                            AND (sh_raa.status IS NULL OR sh_raa.status NOT IN ("Endorsed", "Approved", "Disapproved", "Submitted"))
                        THEN false
                        ELSE true
                    END
                ) as isLocked'),
            ])
            ->whereIn('rto.emp_id', $employeeIds)
            ->where('sh_rto.status', 'Approved')
            ->when($request->filled('emp_id'), fn($q) => $q->where('emp_id', $request->emp_id))
            ->when($request->filled('date'), fn($q) => $q->whereDate('date', Carbon::parse($request->date)->format('Y-m-d')));


        if ($search) {
            $targetsQuery->where(function($query) use ($search) {
                $query->where('sh_raa.status', 'like', "%{$search}%")
                    ->orWhereRaw("DATE_FORMAT(rto.date, '%M %Y') like ?", ["%{$search}%"])
                    ->orWhereIn('rto.id', function($sub) use ($search) {
                        $sub->select('rto2.id')
                            ->from('flexi_rto as rto2')
                            ->join('flexi_target as ft', 'ft.rto_id', '=', 'rto2.id')
                            ->whereRaw("ft.output like ?", ["%{$search}%"]);
                    });
            });
        }

        // Sorting
        if ($sort && isset($sortable[$sort]) && in_array(strtolower($direction), ['asc', 'desc'])) {
            $targetsQuery->orderBy($sortable[$sort], $direction);
        } else {
            $targetsQuery->orderBy('rto.date', 'desc');
        }

        $targets = $targetsQuery->paginate(20);

        $targets->getCollection()->transform(function ($item) use ($employees, $allEmployees, $conn2) {
            $item->employee_name     = $employees[$item->emp_id]->name ?? null;
            $item->rto_acted_by_name = $allEmployees[$item->rto_acted_by]->name ?? null;
            $item->raa_acted_by_name = $allEmployees[$item->raa_acted_by]->name ?? null;

            $item->outputs = $conn2->table('flexi_target')
                ->where('rto_id', $item->id)
                ->select('id', 'output')
                ->get()
                ->map(function ($output) use ($conn2) {
                    $output->accomplishments = $conn2->table('flexi_accomplishment')
                        ->where('target_id', $output->id)
                        ->select('id', 'accomplishment', 'remarks')
                        ->get()
                        ->map(function ($acc) use ($conn2) {
                            $files = $conn2->table('file')
                                ->where(['model' => 'RAA', 'itemId' => $acc->id])
                                ->get()
                                ->map(fn($file) => [
                                    'id'       => $file->id,
                                    'filename' => $file->name,
                                    'type'     => $file->type,
                                    'hash'     => $file->hash,
                                    'size'     => $file->size,
                                    'path'     => route('files.download', $file->id),
                                ]);
                            $acc->files = $files;
                            return $acc;
                        });
                    return $output;
                });

            return $item;
        });

        // Compute Fridays (same as before)
        $fridays = [];
        $now   = Carbon::now();
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

        return Inertia::render('Dtr/Raa/index', [
            'data' => [
                'employees' => $employees->map(fn ($emp) => [
                    'value' => $emp->emp_id,
                    'label' => $emp->name,
                ])->values(),
                'dates'   => $fridays,
                'targets' => $targets,
                'filters' => $request->only(['employee', 'date', 'sort', 'direction', 'search']),
            ],
        ]);
    }

    public function edit($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        // Latest submission_history subqueries
        $latestHistoryRTO = DB::raw("(
            SELECT sh1.*
            FROM submission_history sh1
            INNER JOIN (
                SELECT model_id, MAX(date_acted) as latest_date
                FROM submission_history
                WHERE model = 'RTO'
                GROUP BY model_id
            ) sh2
            ON sh1.model_id = sh2.model_id AND sh1.date_acted = sh2.latest_date
            WHERE sh1.model = 'RTO'
        ) as sh_rto");

        $latestHistoryRAA = DB::raw("(
            SELECT sh1.*
            FROM submission_history sh1
            INNER JOIN (
                SELECT model_id, MAX(date_acted) as latest_date
                FROM submission_history
                WHERE model = 'RAA'
                GROUP BY model_id
            ) sh2
            ON sh1.model_id = sh2.model_id AND sh1.date_acted = sh2.latest_date
            WHERE sh1.model = 'RAA'
        ) as sh_raa");

        // Main query
        $target = $conn2->table('flexi_rto as rto')
            // Removed cross-connection joins
            // ->join($conn3->getDatabaseName().'.tblemployee as e', 'rto.emp_id', '=', 'e.emp_id')
            ->leftJoin($latestHistoryRTO, 'sh_rto.model_id', '=', 'rto.id')
            ->leftJoin($conn2->getDatabaseName().'.flexi_raa as raa', 'raa.rto_id', '=', 'rto.id')
            ->leftJoin($latestHistoryRAA, 'sh_raa.model_id', '=', 'raa.id')
            // ->leftJoin($conn3->getDatabaseName().'.tblemployee as empRto', 'empRto.emp_id', '=', 'sh_rto.acted_by')
            // ->leftJoin($conn3->getDatabaseName().'.tblemployee as empRaa', 'empRaa.emp_id', '=', 'sh_raa.acted_by')
            ->select([
                'rto.*',
                // Employee fields removed because cross-connection join is gone
                // RTO fields
                'sh_rto.status as rto_status',
                'sh_rto.acted_by as rto_acted_by',
                'sh_rto.remarks as rto_remarks',
                'sh_rto.date_acted as rto_date_acted',
                // RAA fields
                'sh_raa.status as raa_status',
                'sh_raa.acted_by as raa_acted_by',
                'sh_raa.remarks as raa_remarks',
                'sh_raa.date_acted as raa_date_acted',
                // isLocked logic
                DB::raw('(
                    CASE 
                        WHEN rto.emp_id = "'.auth()->user()->ipms_id.'" 
                            AND (sh_raa.status IS NULL OR sh_raa.status NOT IN ("Endorsed", "Approved", "Disapproved", "Submitted"))
                        THEN false
                        ELSE true
                    END
                ) as isLocked'),
            ])
            ->where('rto.id', $id)
            ->first();

        if (!$target) {
            abort(404, 'Record not found.');
        }

        // The rest of your logic (outputs, accomplishments, files) remains **unchanged**
        $outputs = $conn2->table('flexi_target')
            ->where('rto_id', $target->id)
            ->select('id', 'output')
            ->get();

        $outputIds = $outputs->pluck('id');

        $accomplishments = $conn2->table('flexi_accomplishment')
            ->whereIn('target_id', $outputIds)
            ->select('id', 'accomplishment', 'remarks', 'rto_id', 'raa_id', 'target_id')
            ->get();

        $accomplishmentIds = $accomplishments->pluck('id');

        $files = $conn2->table('file')
            ->where('model', 'RAA')
            ->whereIn('itemId', $accomplishmentIds)
            ->select('id', 'itemId', 'path', 'name')
            ->get();

        $accomplishmentsByTarget = $accomplishments->groupBy('target_id');
        $filesByAcc = $files->groupBy('itemId');

        foreach ($outputs as $output) {
            $accs = $accomplishmentsByTarget->get($output->id, collect());
            foreach ($accs as $acc) {
                $acc->files = $filesByAcc->get($acc->id, collect());
                $acc->removedFiles = [];
            }
            $output->accomplishments = $accs;
        }

        $target->outputs = $outputs;

        return Inertia::render('Dtr/Raa/Form', [
            'target' => $target,
        ]);
    }
    
    public function store($id, Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $validated = $request->validate([
            'outputs' => 'required|array',
            'outputs.*.accomplishments' => 'required|array',
            'outputs.*.accomplishments.*.accomplishment' => 'required|string|max:1000',
            'outputs.*.accomplishments.*.remarks' => 'nullable|string|max:500',
            'outputs.*.accomplishments.*.files.*' => 'nullable|file|max:5120|mimes:jpg,jpeg,png,pdf,xlsx,docx,xls,doc,ppt,pptx,txt',
        ], [
            'outputs.required' => 'At least one output is required.',
            'outputs.*.accomplishments.required' => 'Each output must have at least one accomplishment.',
            'outputs.*.accomplishments.*.accomplishment.required' => 'Accomplishment is required.',
            'outputs.*.accomplishments.*.accomplishment.max' => 'Accomplishment must not exceed 1000 characters.',
            'outputs.*.accomplishments.*.remarks.max' => 'Remarks must not exceed 500 characters.',
            'outputs.*.accomplishments.*.files.*.file' => 'Each uploaded file must be a valid file.',
            'outputs.*.accomplishments.*.files.*.max' => 'Files must not exceed 5MB.',
            'outputs.*.accomplishments.*.files.*.mimes' => 'Only JPG, PNG, PDF, Excel, Word, PowerPoint, or TXT files are allowed.',
        ]);

        try {
            $conn2->beginTransaction();

            // Insert/update RAA header
            $conn2->table('flexi_raa')->updateOrInsert(
                ['rto_id' => $id],
                ['rto_id' => $id, 'created_by' => auth()->user()->ipms_id, 'created_at' => now()]
            );

            $raaId = $conn2->table('flexi_raa')
                ->where('rto_id', $id)
                ->value('id');

            foreach ($request->outputs as $output) {
                foreach ($output['accomplishments'] as $accomplishment) {
                    $accomplishmentData = [
                        'rto_id'        => $id,
                        'raa_id'        => $raaId,
                        'target_id'     => $output['target_id'],
                        'accomplishment'=> $accomplishment['accomplishment'],
                        'remarks'       => $accomplishment['remarks'] ?? null,
                        'created_by'    => auth()->user()->ipms_id,
                        'created_at'    => now(),
                    ];

                    $accId = $accomplishment['id'] ?? null;

                    if ($accId) {
                        $conn2->table('flexi_accomplishment')
                            ->where('id', $accId)
                            ->update($accomplishmentData);
                    } else {
                        $accId = $conn2->table('flexi_accomplishment')
                            ->insertGetId($accomplishmentData);
                    }

                    // Remove deleted files
                    if (!empty($accomplishment['removedFiles'])) {
                        
                        $files = $conn2->table('file')
                        ->whereIn('id', $accomplishment['removedFiles'])
                        ->get();

                        foreach ($files as $file) {
                            if (Storage::disk('public')->exists($file->path)) {
                                Storage::disk('public')->delete($file->path);
                            }

                            if (Storage::disk('private')->exists($file->path)) {
                                Storage::disk('private')->delete($file->path);
                            }
                        }

                        $conn2->table('file')
                        ->whereIn('id', $accomplishment['removedFiles'])
                        ->delete();
                    }

                    // Add new files
                    if (!empty($accomplishment['files'])) {
                        foreach ($accomplishment['files'] as $file) {
                            $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();

                            $filePath = $file->storeAs('uploads/raa', $filename, 'private');

                            $conn2->table('file')->insert([
                                'model'       => 'RAA',
                                'itemId'      => $accId,
                                'name'        => $file->getClientOriginalName(),
                                'path'        => $filePath,
                                'size'        => $file->getSize(),
                                'mime'        => $file->getMimeType(),
                                'hash'        => $file->hashName(),
                                'type'        => $file->getClientOriginalExtension(),
                                'date_upload' => now()->timestamp,
                            ]);
                        }
                    }
                }

                // Remove deleted accomplishments
                if (!empty($output['removedAccomplishments'])) {

                    $files = $conn2->table('file')
                    ->where('model', 'RAA')
                    ->whereIn('itemId', $output['removedAccomplishments'])
                    ->get();

                    foreach ($files as $f) {
                        if (Storage::disk('public')->exists($f->path)) {
                            Storage::disk('public')->delete($f->path);
                        }

                        if (Storage::disk('private')->exists($f->path)) {
                            Storage::disk('private')->delete($f->path);
                        }
                    }

                    $conn2->table('file')
                    ->where('model', 'RAA')
                    ->whereIn('itemId', $output['removedAccomplishments'])
                    ->delete();

                    $conn2->table('flexi_accomplishment')
                    ->whereIn('id', $output['removedAccomplishments'])
                    ->delete();
                }
            }

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('RAA Error: ' . $e->getMessage());

            return back()->with([
                'status'  => 'error',
                'title'   => 'Error',
                'message' => 'An error occurred while saving accomplishments.',
            ]);
        }

        return back()->with('success', 'Accomplishments saved successfully!');
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

            $existingOutputs = $conn2->table('flexi_target')
                ->where('rto_id', $rto->id)
                ->get()
                ->keyBy('id');

            $requestIds = collect($validated['outputs'])
                ->pluck('id')
                ->filter()
                ->map(fn($oid) => (int) $oid)
                ->toArray();

            // Delete removed outputs
            $conn2->table('flexi_target')
                ->where('rto_id', $rto->id)
                ->whereNotIn('id', $requestIds)
                ->delete();

            // Insert or update
            foreach ($validated['outputs'] as $out) {
                if (!empty($out['id']) && isset($existingOutputs[$out['id']])) {
                    $conn2->table('flexi_target')
                        ->where('id', $out['id'])
                        ->update([
                            'output'     => $out['output'],
                            'date'       => $validated['date'],
                            'updated_by' => $user->ipms_id,
                            'updated_at' => now(),
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

    public function submit($id)
    {
        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $raa = $conn2->table('flexi_raa')->where('rto_id', $id)->first();

            if (!$raa) {
                abort(404, 'RAA not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RAA',
                'model_id' => $raa->id,
                'status' => 'Submitted',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error submitting RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while submitting RAA. Please try again.'
            ]);
        }
    }

    public function endorse($id)
    {

        $conn2 = DB::connection('mysql2');

        try {

            $conn2->beginTransaction();

            $raa = $conn2->table('flexi_raa')->where('rto_id', $id)->first();

            if (!$raa) {
                abort(404, 'RTO not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RAA',
                'model_id' => $raa->id,
                'status' => 'Endorsed',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error endorsing RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while endorsing RAA. Please try again.'
            ]);
        }
    }

    public function endorseViaEmail($token)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');

        try {

            $conn2->beginTransaction();
            $conn3->beginTransaction();
            $conn4->beginTransaction();

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
            
            $raa = $conn2->table('flexi_raa')->where('id', $link->model_id)->first();

            if (!$raa) {
                abort(404, 'RAA not found');
            }

            $rto = $conn2->table('flexi_rto')->where('id', $raa->rto_id)->first();

            if (!$rto) {
                abort(404, 'RTO not found');
            }

            $user = User::find($link->user_id);

            if (!$user) {
                abort(404, 'User not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RAA',
                'model_id' => $raa->id,
                'status' => 'Endorsed',
                'acted_by' => $user->ipms_id,
                'date_acted' => now(),
            ]);

            $conn4->table('email_links')
            ->where('token', $token)
            ->update(['is_used' => true]);

            // Audit log (optional)
            Log::info("RAA {$raa->id} endorsed via email by user {$user->email}");

            $ard = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_ARD']);
            })->get();

            if ($ard->isEmpty()) {

                Log::warning("No ARD users found for endorsement notification.");

            } else {

                $submitter = User::where('ipms_id', $rto->emp_id)->first();

                if ($submitter) {
                    $payload = [
                        'raa_id' => $raa->id,
                        'submitter_email' => $submitter->email,
                        'endorser_id' => $user->ipms_id,
                    ];

                    Notification::send($ard, new NotifyArdOfRaaEndorsement($payload));
                }
            }

            $conn2->commit();
            $conn3->commit();
            $conn4->commit();

            return Inertia::render('ThankYou', [
                'message' => 'You have successfully endorsed the RAA.',
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            $conn3->rollBack();
            $conn4->rollBack();
            Log::error("Failed email endorsement for RAA: " . $e->getMessage());
            
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

            $raa = $conn2->table('flexi_raa')->where('rto_id', $id)->first();

            if (!$raa) {
                abort(404, 'RAA not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RAA',
                'model_id' => $raa->id,
                'status' => 'Approved',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error approving RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while approving RAA. Please try again.'
            ]);
        }
    }

    public function approveViaEmail($token)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');

        try {
            
            $conn2->beginTransaction();
            $conn3->beginTransaction();
            $conn4->beginTransaction();

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
            
            $raa = $conn2->table('flexi_raa')->where('id', $link->model_id)->first();

            if (!$raa) {
                abort(404, 'RAA not found');
            }

            $rto = $conn2->table('flexi_rto')->where('id', $raa->rto_id)->first();

            if (!$rto) {
                abort(404, 'RTO not found');
            }

            $user = User::find($link->user_id);

            if (!$user) {
                abort(404, 'User not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RAA',
                'model_id' => $raa->id,
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
                abort(404, 'Staff not found');
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
                    'raa_id' => $raa->id,
                    'approver_id' => $user->ipms_id,
                    'supervisor_emails' => $supervisors->pluck('email')->toArray(),
                ];

                Notification::send($submitter, new NotifyStaffOfRaaApproval($payload));
            }

            // Audit log (optional)
            Log::info("RAA {$raa->id} approved via email by user {$user->email}");

            $conn2->commit();
            $conn3->commit();
            $conn4->commit();

            return Inertia::render('ThankYou', [
                'message' => 'You have successfully approved the RAA.',
            ]);

        } catch (\Exception $e) {
            $conn2->rollBack();
            $conn3->rollBack();
            $conn4->rollBack();
            Log::error("Failed email approval for RAA: " . $e->getMessage());
            
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
                'remarks.required' => 'Remarks are required to disapprove an RAA.',
                'remarks.string'   => 'Remarks must be a valid text.',
                'remarks.max'      => 'Remarks cannot exceed 1000 characters.',
            ]
        );

        try {

            $conn2->beginTransaction();

            $raa = $conn2->table('flexi_raa')->where('rto_id', $id)->first();

            if (!$raa) {
                abort(404, 'RAA not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RAA',
                'model_id' => $raa->id,
                'status' => 'Disapproved',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
                'remarks' => $request->remarks
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error disapproving RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while disapproving RAA. Please try again.'
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
                'remarks.required' => 'Remarks are required to return an RAA.',
                'remarks.string'   => 'Remarks must be a valid text.',
                'remarks.max'      => 'Remarks cannot exceed 1000 characters.',
            ]
        );

        try {

            $conn2->beginTransaction();

            $raa = $conn2->table('flexi_raa')->where('rto_id', $id)->first();

            if (!$raa) {
                abort(404, 'RAA not found');
            }

            $conn2->table('submission_history')->insert([
                'model' => 'RAA',
                'model_id' => $raa->id,
                'status' => 'Needs Revision',
                'acted_by' => auth()->user()->ipms_id,
                'date_acted' => now(),
                'remarks' => $request->remarks
            ]);

            $conn2->commit();

        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Error returning RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while returning RAA. Please try again.'
            ]);
        }
    }
    
    public function generate($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $conn4 = DB::connection('mysql4');
        

        $fullName = DB::raw("
            CONCAT(
                e.fname, ' ',
                IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '. '), ''),
                e.lname
            ) AS name
        ");

        $getSignature = function ($binary) {
            if (!$binary) return null;
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_buffer($finfo, $binary);
            finfo_close($finfo);
            return 'data:' . $mimeType . ';base64,' . base64_encode($binary);
        };

        $rto = $conn2->table('flexi_rto')->where('id', $id)->first();

        if (!$rto) abort(404, 'RTO not found');

        $employee = $conn3->table('tblemployee')
            ->select(['emp_id', DB::raw("CONCAT(fname,' ', IF(mname IS NOT NULL AND mname != '', CONCAT(LEFT(mname,1),'. '),'') , lname) as name"), 'division_id'])
            ->where('emp_id', $rto->emp_id)
            ->first();

        $rto->name = $employee->name ?? null;
        $rto->division_id   = $employee->division_id ?? null;

        $raa = $conn2->table('flexi_raa')->where('flexi_raa.rto_id', $rto->id)->first();

        if (!$raa) abort(404, 'RAA not found');

        $raa->name = $employee->name ?? null;
        $raa->division_id   = $employee->division_id ?? null;
        $raa->emp_id   = $employee->emp_id ?? null;

        $outputs = $conn2->table('flexi_target')
        ->where('rto_id', $raa->rto_id)
        ->select('id', 'output')
        ->get();

        $accomplishments = $conn2->table('flexi_accomplishment')
        ->whereIn('target_id', $outputs->pluck('id'))
        ->select('id', 'accomplishment', 'remarks', 'target_id')
        ->get()
        ->groupBy('target_id');

        foreach ($outputs as $output) {
            $output->accomplishments = $accomplishments->get($output->id, collect());
        }

        // Get current RAA status
        $currentStatus = $conn2->table('submission_history')
            ->where('model', 'RAA')
            ->where('model_id', $raa->id)
            ->orderByDesc('date_acted')
            ->first()?->status;

        // -------------------
        // Supervisor Info
        // -------------------
        $endorser = $conn2->table('submission_history')
            ->where('model', 'RAA')
            ->where('model_id', $raa->id)
            ->where('status', 'Endorsed')
            ->orderByDesc('date_acted')
            ->first();

        $dcUser = User::role('HRIS_DC')->where('division', $raa->division_id)->first();
        $supervisorEmpId = $endorser->acted_by ?? $dcUser->ipms_id ?? null;

        $supervisorInfo = $supervisorEmpId
            ? $conn3->table('tblemployee as e')
                ->select(['e.emp_id', DB::raw("CONCAT(fname,' ', IF(mname IS NOT NULL AND mname != '', CONCAT(LEFT(mname,1),'. '),'') , lname) as name"), 'e.division_id'])
                ->where('e.work_status', 'active')
                ->where('e.emp_id', $supervisorEmpId)
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
            ->where(['model' => 'RAA', 'model_id' => $raa->id, 'status' => 'Approved'])
            ->orderByDesc('date_acted')
            ->first();

        $approverName = $approverInfo
            ? $conn3->table('tblemployee as e')
                ->select(['e.emp_id', DB::raw("CONCAT(fname,' ', IF(mname IS NOT NULL AND mname != '', CONCAT(LEFT(mname,1),'. '),'') , lname) as name"), 'e.division_id'])
                ->where(['e.emp_id' => $approverInfo->acted_by, 'e.work_status' => 'active'])
                ->first()?->name
            : $conn2->table('settings')->where('title', 'Agency Sub-Head')->value('value');

        $approverPosition = $approverInfo
            ? $conn3->table('tblemp_emp_item as eei')
                ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
                ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
                ->where('eei.emp_id', $approverInfo->acted_by)
                ->whereNull('eei.to_date')
                ->orderByDesc('eei.from_date')
                ->value('p.post_description')
            : $conn2->table('settings')->where('title', 'Agency Sub-Head Position')->value('value');

        $approverSignature = null;
        if ($approverInfo && $currentStatus === 'Approved') {
            $approver = $conn4->table('users')->where('ipms_id', $approverInfo->acted_by)->first();
            $approverSignature = $approver ? $getSignature($approver->signature) : null;
        }

        // -------------------
        // Agency Head
        // -------------------
        $rdName = $conn2->table('settings')->where('title', 'Agency Head')->value('value');
        $rdPosition = $conn2->table('settings')->where('title', 'Agency Head Position')->value('value');
        $rdUser = User::role('HRIS_RD')->first();
        $rdSignature = $rdUser ? $getSignature($rdUser->signature) : null;

        // -------------------
        // Creator Info
        // -------------------
        $creator = $conn4->table('users')->where('ipms_id', $raa->emp_id)->first();
        $creatorSignature = $creator ? $getSignature($creator->signature) : null;
        $creatorPosition = $conn3->table('tblemp_emp_item as eei')
            ->leftJoin('tblemp_position_item as epi', 'eei.item_no', '=', 'epi.item_no')
            ->leftJoin('tblposition as p', 'p.position_id', '=', 'epi.position_id')
            ->select([
                'p.post_description as position'
            ])
            ->where('eei.emp_id', $raa->emp_id) 
            ->whereNull('eei.to_date')
            ->orderBy('eei.from_date', 'desc')
            ->first();

        $today = now()->format('YmdHis');
        $rtoDate = Carbon::parse($rto->date)->format('F_d_Y');

        $pdf = Pdf::loadView('reports.raa', [
            'rto' => $rto,
            'raa' => $raa,
            'position'  => $creatorPosition,
            'outputs' => $outputs,
            'date' => $today,
            'supervisorName' => $supervisorInfo->name ?? '',
            'rdName' => $rdName,
            'rdPosition' => $rdPosition,
            'approverName' => $approverName,
            'approverPosition' => $approverPosition,
            'creatorSignature' => $creatorSignature,
            'supervisorSignature' => $supervisorSignature,
            'approverSignature' => $approverSignature,
            'rdSignature' => $rdSignature,
        ]);

        // -----------------------------
        // Generate PDF with TCPDF
        // -----------------------------
        /* $pdf = new TCPDF();
        $pdf->SetCreator('Flexiplace System');
        $pdf->SetAuthor($rto->name ?? '');
        $pdf->SetTitle("RAA Report");
        $pdf->SetMargins(15, 40, 15); // left, top, right
        $pdf->SetAutoPageBreak(true, 35); // bottom margin

        $pdf->AddPage();

        // Output the HTML content
        $pdf->writeHTML($html, true, false, true, false, '');

        // -----------------------------
        // Apply digital signature if available
        // -----------------------------
        if ($creator && $creator->digital_sig) {
            $tempP12 = tempnam(sys_get_temp_dir(), 'cert') . '.p12';
            file_put_contents($tempP12, $creator->digital_sig);

            $certs = [];
            $p12Password = ''; // set password if your .p12 has one
            if (openssl_pkcs12_read(file_get_contents($tempP12), $certs, $p12Password)) {
                // write cert and private key to temp PEM files
                $tempCert = tempnam(sys_get_temp_dir(), 'cert') . '_cert.pem';
                $tempKey  = tempnam(sys_get_temp_dir(), 'cert') . '_key.pem';
                file_put_contents($tempCert, $certs['cert']);
                file_put_contents($tempKey, $certs['pkey']);

                // Apply signature
                $pdf->setSignature(
                    $tempCert,
                    $tempKey,
                    '', // private key password
                    '', // certification info
                    2,  // certification level
                    ['Name' => $rto->name ?? '', 'Location' => 'DEPDev RO1', 'Reason' => 'RAA Submission']
                );
            }
        } */

        //return $pdf->Output("{$today}_RAA_{$rtoDate}.pdf", 'D');
        return $pdf->download("{$today}_RAA_{$rtoDate}.pdf");
    }
}
