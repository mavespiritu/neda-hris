<?php

namespace App\Http\Controllers\Vacancies;

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

use App\Notifications\Vacancies\NotifyArdOfVacancySubmission;
use App\Notifications\Vacancies\NotifyStaffOfVacancyApproval;
use App\Notifications\Vacancies\NotifyStaffOfVacancyDisapproval;
use App\Notifications\Vacancies\NotifyStaffOfVacancyReturn;

class NotificationController extends Controller
{
    public function submit($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $vacancy = $conn2->table('vacancy')
            ->where('id', $id)
            ->first();

            if (!$vacancy) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vacancy record not found.'
                ]);
            }

            $staff = $conn3->table('tblemployee')
            ->where('emp_id', $vacancy->created_by)
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

            $ard = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_ARD']);
            })
            ->get();

            if ($ard->isEmpty()) {
                Log::warning("No ard found");
            }

            $payload = [
                'vacancy_id' => $vacancy->id,
                'sender_id' => $vacancy->created_by,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
            ];

            if($ard){
                Notification::sendNow($ard, new NotifyArdOfVacancySubmission($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function approve($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $vacancy = $conn2->table('vacancy')
            ->where('id', $id)
            ->first();

            if (!$vacancy) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vacancy record not found.'
                ]);
            }

            $staff = $conn3->table('tblemployee')
            ->where('emp_id', $vacancy->created_by)
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

            $hrs = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_HR']);
            })
            ->get();

            if ($hrs->isEmpty()) {
                Log::warning("No HRs found");
            }

            $submitter = User::where('ipms_id', $vacancy->created_by)->first();

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $payload = [
                'vacancy_id' => $vacancy->id,
                'approver_id' => $userId,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
                'hr_emails' => $hrs->pluck('email')->toArray(),
            ];

            if($submitter){
                Notification::sendNow($submitter, new NotifyStaffOfVacancyApproval($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to approve vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function disapprove($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $vacancy = $conn2->table('vacancy')
            ->where('id', $id)
            ->first();

            if (!$vacancy) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vacancy record not found.'
                ]);
            }

            $staff = $conn3->table('tblemployee')
            ->where('emp_id', $vacancy->created_by)
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

            $submitter = User::where('ipms_id', $vacancy->created_by)->first();

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $remarks = $conn2->table('submission_history')->where([
                'model' => 'Vacancy',
                'model_id' => $vacancy->id,
                'status' => 'Disapproved',
                'acted_by' => $userId,
            ])
            ->orderBy('date_acted', 'desc')
            ->first();

            if (!$remarks) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Remarks not found.'
                ]);
            }

            $payload = [
                'vacancy_id' => $vacancy->id,
                'disapprover_id' => $userId,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
                'remarks' => $remarks->remarks
            ];

            if($submitter){
                Notification::sendNow($submitter, new NotifyStaffOfVacancyDisapproval($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to disapprove vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function return($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $vacancy = $conn2->table('vacancy')
            ->where('id', $id)
            ->first();

            if (!$vacancy) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Vacancy record not found.'
                ]);
            }

            $staff = $conn3->table('tblemployee')
            ->where('emp_id', $vacancy->created_by)
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

            $submitter = User::where('ipms_id', $vacancy->created_by)->first();

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $remarks = $conn2->table('submission_history')->where([
                'model' => 'Vacancy',
                'model_id' => $vacancy->id,
                'status' => 'Needs Revision',
                'acted_by' => $userId,
            ])
            ->orderBy('date_acted', 'desc')
            ->first();

            if (!$remarks) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Remarks not found.'
                ]);
            }

            $payload = [
                'vacancy_id' => $vacancy->id,
                'returner_id' => $userId,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
                'remarks' => $remarks->remarks
            ];

            if($submitter){
                Notification::sendNow($submitter, new NotifyStaffOfVacancyReturn($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to return RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }
}
