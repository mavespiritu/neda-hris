<?php

namespace App\Http\Controllers;

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
use App\Notifications\NotifySupervisorOfGapAnalysisSubmission;
use App\Notifications\NotifyStaffOfGapAnalysisEndorsement;
use App\Notifications\NotifySupervisorOfGapAnalysisEndorsement;
use App\Notifications\NotifyStaffOfGapAnalysisApproval;
use App\Notifications\NotifyStaffOfGapAnalysisDisapproval;

use App\Notifications\NotifySupervisorOfRtoSubmission;
use App\Notifications\NotifyArdOfRtoEndorsement;
use App\Notifications\NotifyStaffOfRtoApproval;
use App\Notifications\NotifyStaffOfRtoDisapproval;
use App\Notifications\NotifyStaffOfRtoReturn;

use App\Notifications\NotifySupervisorOfRaaSubmission;
use App\Notifications\NotifyArdOfRaaEndorsement;
use App\Notifications\NotifyStaffOfRaaApproval;
use App\Notifications\NotifyStaffOfRaaDisapproval;
use App\Notifications\NotifyStaffOfRaaReturn;

use App\Notifications\NotifyApplicantOfApplicationSubmission;
use App\Notifications\NotifyHROfApplicationSubmission;

class NotificationController extends Controller
{
    public function submitGapAnalysis(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{
            $staff = $conn3->table('tblemployee')
            ->where('emp_id', $request->emp_id)
            ->first();

            $supervisors = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_ADC', 'HRIS_DC']);
            })
            ->where('division', $staff->division_id)
            ->get();

            $payload = [
                'emp_id' => $staff->emp_id
            ];

            if($supervisors){
                Notification::send($supervisors, new NotifySupervisorOfGapAnalysisSubmission($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit gap analysis: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function endorseGapAnalysis(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        try{
            $competency = $conn2->table('staff_competency_review')
                ->where('id', $request->review_id)
                ->first();

            if($competency){

                $staff = User::where('ipms_id', $competency->emp_id)->first();

                $chief = User::role('HRIS_DC')
                    ->where('division', $staff->division)
                    ->get();

                $payload = [
                    'competency_id' => $competency->id,
                    'endorser_id' => $competency->endorsed_by
                ];

                if($staff){
                    Notification::send($staff, new NotifyStaffOfGapAnalysisEndorsement($payload));
                }

                if($chief){
                    Notification::send($chief, new NotifySupervisorOfGapAnalysisEndorsement($payload));
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to endorse gap analysis: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }

    public function approveGapAnalysis(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        try{
            $competency = $conn2->table('staff_competency_review')
                ->where('id', $request->review_id)
                ->first();

            if($competency){

                $recipient = User::where('ipms_id', $competency->emp_id)->first();

                $payload = [
                    'competency_id' => $competency->id,
                    'approver_id' => $competency->acted_by
                ];

                if($recipient){
                    Notification::send($recipient, new NotifyStaffOfGapAnalysisApproval($payload));
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to approve gap analysis: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }

    public function disapproveGapAnalysis(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        try{
            $competency = $conn2->table('staff_competency_review')
                ->where('id', $request->review_id)
                ->first();

            if($competency){

                $recipient = User::where('ipms_id', $competency->emp_id)->first();

                $payload = [
                    'competency_id' => $competency->id,
                    'disapprover_id' => $competency->acted_by
                ];

                if($recipient){
                    Notification::send($recipient, new NotifyStaffOfGapAnalysisDisapproval($payload));
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to approve gap analysis: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }

    public function submitRto($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $rto = $conn2->table('flexi_rto')
            ->where('id', $id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            $payload = [
                'rto_id' => $rto->id
            ];

            if($supervisors){
                Notification::send($supervisors, new NotifySupervisorOfRtoSubmission($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function endorseRto($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $rto = $conn2->table('flexi_rto')
            ->where('id', $id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            $ard = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_ARD']);
            })
            ->get();

            if ($ard->isEmpty()) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'No ARD users found to notify.'
                ]);
            }

            $submitter = User::where('ipms_id', $rto->emp_id)->first();

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $payload = [
                'rto_id' => $rto->id,
                'submitter_email' => $submitter->email,
                'endorser_id' => $userId,
            ];

            if($ard){
                Notification::send($ard, new NotifyArdOfRtoEndorsement($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to endorse RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function approveRto($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $rto = $conn2->table('flexi_rto')
            ->where('id', $id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $payload = [
                'rto_id' => $rto->id,
                'approver_id' => $userId,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
            ];

            if($submitter){
                Notification::send($submitter, new NotifyStaffOfRtoApproval($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to approve RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function disapproveRto($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $rto = $conn2->table('flexi_rto')
            ->where('id', $id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $remarks = $conn2->table('submission_history')->where([
                'model' => 'RTO',
                'model_id' => $rto->id,
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
                'rto_id' => $rto->id,
                'disapprover_id' => $userId,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
                'remarks' => $remarks->remarks
            ];

            if($submitter){
                Notification::send($submitter, new NotifyStaffOfRtoDisapproval($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to disapprove RTO: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function returnRto($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $rto = $conn2->table('flexi_rto')
            ->where('id', $id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $remarks = $conn2->table('submission_history')->where([
                'model' => 'RTO',
                'model_id' => $rto->id,
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
                'rto_id' => $rto->id,
                'returner_id' => $userId,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
                'remarks' => $remarks->remarks
            ];

            if($submitter){
                Notification::send($submitter, new NotifyStaffOfRtoReturn($payload));
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

    public function submitRaa($id)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $raa = $conn2->table('flexi_raa')
            ->where('rto_id', $id)
            ->first();

            if (!$raa) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RAA record not found.'
                ]);
            }

            $rto = $conn2->table('flexi_rto')
            ->where('id', $raa->rto_id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            $payload = [
                'raa_id' => $raa->id
            ];

            if($supervisors){
                Notification::send($supervisors, new NotifySupervisorOfRaaSubmission($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function endorseRaa($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $raa = $conn2->table('flexi_raa')
            ->where('rto_id', $id)
            ->first();

            if (!$raa) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RAA record not found.'
                ]);
            }

            $rto = $conn2->table('flexi_rto')
            ->where('id', $raa->rto_id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            $ard = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_ARD']);
            })
            ->get();

            if ($ard->isEmpty()) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'No ARD users found to notify.'
                ]);
            }

            $submitter = User::where('ipms_id', $rto->emp_id)->first();

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $payload = [
                'raa_id' => $raa->id,
                'submitter_email' => $submitter->email,
                'endorser_id' => $userId,
            ];

            if($ard){
                Notification::send($ard, new NotifyArdOfRaaEndorsement($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to endorse RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function approveRaa($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $raa = $conn2->table('flexi_raa')
            ->where('rto_id', $id)
            ->first();

            if (!$raa) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RAA record not found.'
                ]);
            }

            $rto = $conn2->table('flexi_rto')
            ->where('id', $raa->rto_id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $payload = [
                'raa_id' => $raa->id,
                'approver_id' => $userId,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
            ];

            if($submitter){
                Notification::send($submitter, new NotifyStaffOfRaaApproval($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to approve RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function disapproveRaa($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $raa = $conn2->table('flexi_raa')
            ->where('rto_id', $id)
            ->first();

            if (!$raa) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RAA record not found.'
                ]);
            }

            $rto = $conn2->table('flexi_rto')
            ->where('id', $raa->rto_id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $remarks = $conn2->table('submission_history')->where([
                'model' => 'RAA',
                'model_id' => $raa->id,
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
                'raa_id' => $raa->id,
                'disapprover_id' => $userId,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
                'remarks' => $remarks->remarks
            ];

            if($submitter){
                Notification::send($submitter, new NotifyStaffOfRaaDisapproval($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to disapprove RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function returnRaa($id, $userId)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{

            $raa = $conn2->table('flexi_raa')
            ->where('rto_id', $id)
            ->first();

            if (!$raa) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RAA record not found.'
                ]);
            }

            $rto = $conn2->table('flexi_rto')
            ->where('id', $raa->rto_id)
            ->first();

            if (!$rto) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'RTO record not found.'
                ]);
            }

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

            if (!$submitter) {
                return redirect()->back()->with([
                    'status' => 'error',
                    'title' => 'Not Found',
                    'message' => 'Submitter account not found.'
                ]);
            }

            $remarks = $conn2->table('submission_history')->where([
                'model' => 'RAA',
                'model_id' => $raa->id,
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
                'raa_id' => $raa->id,
                'returner_id' => $userId,
                'supervisor_emails' => $supervisors->pluck('email')->toArray(),
                'remarks' => $remarks->remarks
            ];

            if($submitter){
                Notification::send($submitter, new NotifyStaffOfRaaReturn($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to return RAA: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }
}
