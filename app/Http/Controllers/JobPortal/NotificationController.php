<?php

namespace App\Http\Controllers\JobPortal;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\Applications\NotifyApplicantOfApplicationSubmission;
use App\Notifications\Applications\NotifyHROfApplicationSubmission;
use App\Notifications\Issues\NotifyAdminOfIssueReported;

class NotificationController extends Controller
{
    public function submitApplication($id)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');
        $conn4 = DB::connection('mysql4');

        try {
            $application = $conn->table('application')->where('id', $id)->first();
            if (!$application) {
                Log::warning("Application not found for ID: {$id}");
                return;
            }

            $vacancy = $conn2->table('vacancy')
                ->select('position_description', 'item_no')
                ->where('id', $application->vacancy_id)
                ->first();

            if (!$vacancy) {
                Log::warning("Vacancy not found for application ID: {$id}");
                return;
            }

            $applicant = $conn->table('application_applicant')
                ->select([
                    DB::raw("CONCAT(first_name,' ', IF(middle_name IS NOT NULL AND middle_name != '', CONCAT(LEFT(middle_name,1),'. '),'') , last_name) as name"),
                    'user_id',
                    'type'
                ])
                ->where('application_id', $application->id)
                ->first();

            if (!$applicant) {
                Log::warning("Applicant not found for application ID: {$id}");
                return;
            }

            $user = $applicant->type == 'Applicant'
                ? \App\Models\Applicant::find($applicant->user_id)
                : \App\Models\User::find($applicant->user_id);

            if (!$user) {
                Log::warning("User not found for applicant {$applicant->user_id}");
                return;
            }

            $payload = [
                'applicantName' => $applicant->name,
                'position' => $vacancy->position_description,
                'itemNo' => $vacancy->item_no,
            ];

            Notification::sendNow($user, new NotifyApplicantOfApplicationSubmission($payload));
        } catch (\Exception $e) {
            Log::error("Failed to send applicant notification for app ID {$id}: {$e->getMessage()}");
        }
    }

    public function receiveApplication($id)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        try {
            $application = $conn->table('application')->where('id', $id)->first();
            if (!$application) {
                Log::warning("Application not found for ID: {$id}");
                return;
            }

            $vacancy = $conn2->table('vacancy')
                ->select('id', 'position_description', 'item_no')
                ->where('id', $application->vacancy_id)
                ->first();

            if (!$vacancy) {
                Log::warning("Vacancy not found for ID: {$application->vacancy_id}");
                return;
            }

            $applicant = $conn->table('application_applicant')
                ->select([
                    DB::raw("CONCAT(first_name,' ', IF(middle_name IS NOT NULL AND middle_name != '', CONCAT(LEFT(middle_name,1),'. '),'') , last_name) as name"),
                    'user_id',
                    'type'
                ])
                ->where('application_id', $application->id)
                ->first();

            if (!$applicant) {
                Log::warning("Applicant not found for application ID: {$id}");
                return;
            }

            $hrs = \App\Models\User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_HR']);
            })->get();

            if ($hrs->isEmpty()) {
                Log::warning("No HR accounts found for notification.");
                return;
            }

            $payload = [
                'applicantName' => $applicant->name,
                'position' => $vacancy->position_description,
                'itemNo' => $vacancy->item_no,
                'vacancyId' => $vacancy->id,
            ];

            Notification::sendNow($hrs, new NotifyHROfApplicationSubmission($payload));
        } catch (\Exception $e) {
            Log::error("Failed to send HR notification for app ID {$id}: {$e->getMessage()}");
        }
    }

    public function reportIssue($id)
    {
        $conn = DB::connection('mysql');

        try {
            $issue = $conn->table('issues')->where('id', $id)->first();
            if (!$issue) {
                Log::warning("Issue not found for ID: {$id}");
                return;
            }

            $admins = \App\Models\User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['HRIS_Administrator']);
            })->get();

            if ($admins->isEmpty()) {
                Log::warning("No Administrators found for notification.");
                return;
            }

            $payload = [
                'name' => $issue->name,
                'email' => $issue->email,
                'message' => $issue->message,
                'created_at' => $issue->created_at,
            ];

            Notification::sendNow($admins, new NotifyAdminOfIssueReported($payload));
        } catch (\Exception $e) {
            Log::error("Failed to send admin notification for issue ID {$id}: {$e->getMessage()}");
        }
    }
}
