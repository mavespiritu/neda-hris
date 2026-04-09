<?php

namespace App\Actions\Flexiplace;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreDtr
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('store', 'flexiplace.dtr');
    }

    public function rules(): array
    {
        return [
            'logType' => ['required', 'in:amIn,amOut,pmIn,pmOut'],
        ];
    }

    public function asController(Request $request)
    {
        Validator::make($request->all(), $this->rules())->validate();

        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');
        $empId = $request->user()->ipms_id ?? null;
        $today = Carbon::today();
        $year = $today->year;
        $month = $today->format('F');
        $logType = $request->input('logType');
        $timeNow = Carbon::now();
        $session = in_array($logType, ['amIn', 'amOut'], true) ? 'AM' : 'PM';
        $approvedRto = $conn2->table('flexi_rto')
            ->where('emp_id', $empId)
            ->whereDate('date', $today->format('Y-m-d'))
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('submission_history as sh')
                    ->whereColumn('sh.model_id', 'flexi_rto.id')
                    ->where('sh.model', 'RTO')
                    ->where('sh.status', 'Approved');
            })
            ->exists();

        if (! $approvedRto) {
            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Not Allowed',
                'message' => 'You can only time in once your RTO has been approved.',
            ]);
        }

        try {
            $conn3->beginTransaction();

            $dtrType = $conn3->table('tblemp_dtr_type')
                ->where('emp_id', $empId)
                ->where('date', $today->format('Y-m-d'))
                ->first();

            if (! $dtrType) {
                $conn3->table('tblemp_dtr_type')->insert([
                    'emp_id' => $empId,
                    'date' => $today->format('Y-m-d'),
                    'total_with_out_pass_slip' => '',
                    'total_with_pass_slip' => '',
                    'total_tardy' => '',
                    'total_UT' => '',
                    'total_pass_slip' => '',
                    'am_in' => '',
                    'am_out' => '',
                    'pm_in' => '',
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

            $existing = $conn3->table('tblactual_dtr')
                ->where('emp_id', $empId)
                ->where('date', $today->format('Y-m-d'))
                ->where('time', $session)
                ->first();

            $defaultDatetime = '0001-01-01 00:00:00';
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

                    $conn3->table('tblemp_dtr_type')
                        ->where('emp_id', $dtrType->emp_id)
                        ->where('date', $dtrType->date)
                        ->where('dtr_id', 'FLEXIPLACE')
                        ->update(['pm_out' => $timeNow->format('g:i:s A')]);

                    $amIn = $conn3->table('tblactual_dtr')
                        ->where('emp_id', $empId)
                        ->where('date', $today->format('Y-m-d'))
                        ->where('time', 'AM')
                        ->value('time_in');

                    $pmOut = $updateData['time_out'];

                    if ($amIn && $amIn !== $defaultDatetime && $pmOut && $pmOut !== $defaultDatetime) {
                        $diff = strtotime($pmOut) - strtotime($amIn);
                        $diff -= 3600;

                        $hours = floor($diff / 3600);
                        $minutes = floor(($diff % 3600) / 60);
                        $seconds = $diff % 60;
                        $formatted = sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);

                        $tardyThreshold = strtotime($today->format('Y-m-d') . ' 09:31:00');
                        $tardy = '00:00:00';

                        if (strtotime($amIn) > $tardyThreshold) {
                            $tardyDiff = strtotime($amIn) - $tardyThreshold;
                            $tardyHours = floor($tardyDiff / 3600);
                            $tardyMinutes = floor(($tardyDiff % 3600) / 60);
                            $tardySeconds = $tardyDiff % 60;
                            $tardy = sprintf('%02d:%02d:%02d', $tardyHours, $tardyMinutes, $tardySeconds);
                        }

                        $conn3->table('tblemp_dtr_type')
                            ->where('emp_id', $dtrType->emp_id)
                            ->where('date', $dtrType->date)
                            ->where('dtr_id', 'FLEXIPLACE')
                            ->update([
                                'total_with_out_pass_slip' => $formatted,
                                'total_with_pass_slip' => $formatted,
                                'total_tardy' => $tardy,
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
                    'emp_id' => $empId,
                    'date' => $today->format('Y-m-d'),
                    'time' => $session,
                    'time_in' => $defaultDatetime,
                    'time_out' => $defaultDatetime,
                    'year' => $year,
                    'month' => $month,
                ];

                $conn3->table('tblactual_dtr')->insert(array_merge($insertData, $updateData));
            }

            $conn3->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Flexiplace time record saved successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn3->rollBack();
            Log::error('Error recording time: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving flexiplace DTR. Please try again.',
            ]);
        }
    }
}
