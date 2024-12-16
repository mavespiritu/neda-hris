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
use App\Notifications\CompetenciesForReviewSubmitted;
use App\Notifications\CompetenciesForReviewApproved;

class NotificationController extends Controller
{
    public function submitCga(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        try{
            $staff = $conn3->table('tblemployee')
                ->where('emp_id', $request->emp_id)
                ->first();

            $supervisors = User::role('HRIS_DC')->where('division', $staff->division_id)->get();

            $payload = [
                'emp_id' => $staff->emp_id
            ];

            if($supervisors){
                Notification::sendNow($supervisors, new CompetenciesForReviewSubmitted($payload));
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }    
    }

    public function approveCga(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $user = Auth::user();

        try{
            $conn2->table('staff_competency_review')
                ->where('id', $request->review_id)
                ->update([
                    'status' => 'Approved',
                    'acted_by' => $user->ipms_id,
                    'date_acted' => Carbon::now()->format('Y-m-d H:i:s')
                ]);

            $competency = $conn2->table('staff_competency_review')
                ->where('id', $request->review_id)
                ->first();

            if($competency->acted_by){

                $recipient = User::where('ipms_id', $competency->emp_id)->first();

                $payload = [
                    'competency_id' => $competency->id,
                    'approver_id' => $competency->acted_by
                ];

                if($recipient){
                    Notification::sendNow($recipient, new CompetenciesForReviewApproved($payload));
                }
            }

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Email notification sent!'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to submit competency: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while sending an email notification. Please try again.'
            ]);
        }
    }
}
