<?php

namespace App\Http\Controllers\Dtr;

use App\Http\Controllers\Controller;
use App\Http\Controllers\BaseController;
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

class FwaController extends Controller
{
    /* protected $accessRules = [
        'index' => 'fwa-dtr-index',  
    ]; */

    public function index()
    {
        $conn2 = DB::connection('mysql2'); // flexi tables
        $conn3 = DB::connection('mysql3'); // DTR tables

        $empId = auth()->user()->ipms_id ?? null; 
        $today = now()->format('Y-m-d');
        $year  = now()->year;
        $month = now()->format('F');
        $invalidDate = '0001-01-01 00:00:00';

        // --- Fetch AM record
        $am = $conn3->table('tblactual_dtr')
            ->where('emp_id', $empId)
            ->where('date', $today)
            ->where('time', 'AM')
            ->where('year', $year)
            ->where('month', $month)
            ->first();

        // --- Fetch PM record
        $pm = $conn3->table('tblactual_dtr')
            ->where('emp_id', $empId)
            ->where('date', $today)
            ->where('time', 'PM')
            ->where('year', $year)
            ->where('month', $month)
            ->first();

        // Normalize invalid times
        $amIn  = ($am?->time_in  === $invalidDate) ? null : $am?->time_in;
        $amOut = ($am?->time_out === $invalidDate) ? null : $am?->time_out;
        $pmIn  = ($pm?->time_in  === $invalidDate) ? null : $pm?->time_in;
        $pmOut = ($pm?->time_out === $invalidDate) ? null : $pm?->time_out;

        // Determine next logType
        $logType = null;
        if (!$amIn) {
            $logType = 'amIn';
        } elseif (!$amOut) {
            $logType = 'amOut';
        } elseif (!$pmIn) {
            $logType = 'pmIn';
        } elseif (!$pmOut) {
            $logType = 'pmOut';
        }

        // --- Fetch schedule (mysql2)
        $schedule = $conn2->table('flexi_schedule')
            ->select('emp_id', 'dtr_type', 'date')
            ->where('emp_id', $empId)
            ->where('date', $today)
            ->where('dtr_type', 'Flexiplace')
            ->first();

        // --- Get latest RTO status separately (no join)
        $latestStatus = $conn2->table('submission_history')
            ->select('model_id', 'status')
            ->where('model', 'RTO')
            ->orderBy('date_acted', 'desc');

        $approvedRto = $conn2->table('flexi_rto')
            ->where('emp_id', $empId)
            ->whereDate('date', $today)
            ->whereExists(function ($q) use ($latestStatus) {
                $q->select(DB::raw(1))
                    ->from('submission_history as sh')
                    ->whereColumn('sh.model_id', 'flexi_rto.id')
                    ->where('sh.model', 'RTO')
                    ->where('sh.status', 'Approved')
                    ->orderBy('sh.date_acted', 'desc');
            })
            ->exists();

        // Determine flexiplace flag
        $isFlexiplaceToday = $schedule !== null && $approvedRto;

        // Return Inertia data
        return Inertia::render('Dtr/Fwa/index', [
            'data' => [
                'amIn' => $amIn,
                'amOut' => $amOut,
                'pmIn' => $pmIn,
                'pmOut' => $pmOut,
                'logType' => $logType,
                'schedule' => $schedule,
                'approvedRto' => $approvedRto,
                'isFlexiplaceToday' => $isFlexiplaceToday,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        
        $request->validate([
            'logType' => 'required|in:amIn,amOut,pmIn,pmOut',
        ]);

        $empId = auth()->user()->ipms_id ?? null; 
        $today = Carbon::today();
        $year  = $today->year;
        $month = $today->format('F');
        $logType = $request->input('logType');
        $timeNow = Carbon::now(); 

        $session = in_array($logType, ['amIn','amOut']) ? 'AM' : 'PM';

        DB::beginTransaction();

        try {
            // ensure dtr_type exists
            $dtrType = $conn3->table('tblemp_dtr_type')
                ->where('emp_id', $empId)
                ->where('date', $today->format('Y-m-d'))
                ->first();

            if (!$dtrType) {
                $conn3->table('tblemp_dtr_type')->insert([
                    'emp_id' => $empId,
                    'date'   => $today->format('Y-m-d'),
                    'total_with_out_pass_slip'  => '',
                    'total_with_pass_slip'  => '',
                    'total_tardy'  => '',
                    'total_UT'  => '',
                    'total_pass_slip'  => '',
                    'am_in'  => '',
                    'am_out' => '',
                    'pm_in'  => '',
                    'pm_out' => '',
                    'total_OT' => '',
                    'multiplied_total_OT' => '',
                    'dtr_id' => 'FLEXIPLACE',
                ]);

                $dtrType = $conn3->table('tblemp_dtr_type')
                    ->where('emp_id', $empId)
                    ->where('date', $today->format('Y-m-d'))
                    ->first();
            }

            // check tblactual_dtr existing row
            $existing = $conn3->table('tblactual_dtr')
                ->where('emp_id', $empId)
                ->where('date', $today->format('Y-m-d'))
                ->where('time', $session)
                ->first();

            // default values for insert
            $defaultDatetime = "0001-01-01 00:00:00";
            $updateData = [];

            switch ($logType) {
                case 'amIn':
                    $updateData['time_in'] = $timeNow->format('Y-m-d H:i:s');
                    $conn3->table('tblemp_dtr_type')
                        ->where('emp_id', $dtrType->emp_id)
                        ->where('date', $dtrType->date)
                        ->where('dtr_id', 'FLEXIPLACE')
                        ->update(['am_in' => $timeNow->format('g:i:s A')]);
                    break;

                case 'amOut':
                    $updateData['time_out'] = $timeNow->format('Y-m-d H:i:s');
                    $conn3->table('tblemp_dtr_type')
                        ->where('emp_id', $dtrType->emp_id)
                        ->where('date', $dtrType->date)
                        ->where('dtr_id', 'FLEXIPLACE')
                        ->update(['am_out' => $timeNow->format('g:i:s A')]);
                    break;

                case 'pmIn':
                    $updateData['time_in'] = $timeNow->format('Y-m-d H:i:s');
                    $conn3->table('tblemp_dtr_type')
                        ->where('emp_id', $dtrType->emp_id)
                        ->where('date', $dtrType->date)
                        ->where('dtr_id', 'FLEXIPLACE')
                        ->update(['pm_in' => $timeNow->format('g:i:s A')]);
                    break;

                case 'pmOut':
                $updateData['time_out'] = $timeNow->format('Y-m-d H:i:s');

                // Update pm_out field
                $conn3->table('tblemp_dtr_type')
                    ->where('emp_id', $dtrType->emp_id)
                    ->where('date', $dtrType->date)
                    ->where('dtr_id', 'FLEXIPLACE')
                    ->update(['pm_out' => $timeNow->format('g:i:s A')]);

                // fetch AM In + PM Out
                $amIn = $conn3->table('tblactual_dtr')
                    ->where('emp_id', $empId)
                    ->where('date', $today->format('Y-m-d'))
                    ->where('time', 'AM')
                    ->value('time_in');

                $pmOut = $updateData['time_out'];

                if ($amIn && $amIn !== "0001-01-01 00:00:00" && $pmOut && $pmOut !== "0001-01-01 00:00:00") {
                    $diff = strtotime($pmOut) - strtotime($amIn);
                    $diff -= 3600; // subtract 1 hour lunch

                    $hours   = floor($diff / 3600);
                    $minutes = floor(($diff % 3600) / 60);
                    $seconds = $diff % 60;

                    $formatted = sprintf("%02d:%02d:%02d", $hours, $minutes, $seconds);

                    // --- Compute tardy ---
                    $tardyThreshold = strtotime($today->format('Y-m-d') . " 09:31:00");
                    $tardy = "00:00:00";

                    if (strtotime($amIn) > $tardyThreshold) {
                        $tardyDiff = strtotime($amIn) - $tardyThreshold;

                        $tardyHours   = floor($tardyDiff / 3600);
                        $tardyMinutes = floor(($tardyDiff % 3600) / 60);
                        $tardySeconds = $tardyDiff % 60;

                        $tardy = sprintf("%02d:%02d:%02d", $tardyHours, $tardyMinutes, $tardySeconds);
                    }

                    // Update dtr_type table
                    $conn3->table('tblemp_dtr_type')
                        ->where('emp_id', $dtrType->emp_id)
                        ->where('date', $dtrType->date)
                        ->where('dtr_id', 'FLEXIPLACE')
                        ->update([
                            'total_with_out_pass_slip' => $formatted,
                            'total_with_pass_slip'     => $formatted,
                            'total_tardy'              => $tardy,
                        ]);
                }
                break;
            }

            if ($existing) {
                $conn3->table('tblactual_dtr')
                    ->where('emp_id', $empId)
                    ->where('date', $today->format('Y-m-d'))
                    ->where('time', $session)
                    ->update($updateData);
            } else {
                $insertData = [
                    'emp_id'   => $empId,
                    'date'     => $today->format('Y-m-d'),
                    'time'     => $session,
                    'time_in'  => $defaultDatetime,
                    'time_out' => $defaultDatetime,
                    'year'     => $year,
                    'month'    => $month,
                ];

                $insertData = array_merge($insertData, $updateData);

                $conn3->table('tblactual_dtr')->insert($insertData);
            }

            DB::commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title'  => 'Success!',
                'message'=> 'Flexiplace time record saved successfully.'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error recording time: ' . $e->getMessage());
            
            return redirect()->back()->with([
                'status' => 'error',
                'title'  => 'Uh oh! Something went wrong.',
                'message'=> 'An error occurred while saving flexiplace DTR. Please try again.'
            ]);
        }   
    }

}
