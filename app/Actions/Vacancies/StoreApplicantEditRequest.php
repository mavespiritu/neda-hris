<?php

namespace App\Actions\Vacancies;

use App\Models\AppEditRequest;
use App\Models\AppEditRequestLog;
use App\Notifications\Applications\NotifyApplicantOfEditRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreApplicantEditRequest
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        $allowedRoles = ['HRIS_HR', 'HRIS_RD', 'HRIS_ARD'];
        $userRoles = $user->roles->pluck('name')->toArray();

        return (bool) array_intersect($allowedRoles, $userRoles);
    }

    public function asController(Request $request, int $vacancy, int $application)
    {
        $validated = Validator::make($request->all(), [
            'remarks' => ['required', 'string'],
        ], [
            'remarks.required' => 'Remarks is required.',
        ])->validate();

        $normalizedRemarks = trim(strip_tags($validated['remarks']));

        if ($normalizedRemarks === '') {
            return response()->json([
                'title' => 'Edit request not saved',
                'message' => 'Remarks is required.',
            ], 422);
        }

        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $applicationRecord = $conn->table('application as a')
            ->join('application_applicant as aa', 'aa.application_id', '=', 'a.id')
            ->select(
                'a.id',
                'a.vacancy_id',
                'aa.email_address',
                DB::raw("CONCAT(aa.last_name, ', ', aa.first_name) AS applicant_name")
            )
            ->where('a.id', $application)
            ->first();

        if (! $applicationRecord || (int) $applicationRecord->vacancy_id !== $vacancy) {
            abort(404, 'Applicant not found for this vacancy.');
        }

        if (! $applicationRecord->email_address) {
            return response()->json([
                'title' => 'Edit request not allowed',
                'message' => 'The selected applicant does not have an email address on file.',
            ], 422);
        }

        $vacancyRecord = $conn2->table('vacancy')
            ->select('id', 'position_description', 'item_no', 'appointment_status')
            ->where('id', $vacancy)
            ->first();

        $publication = $conn2->table('publication_vacancies as pv')
            ->join('publication as p', 'p.id', '=', 'pv.publication_id')
            ->where('pv.vacancy_id', $vacancy)
            ->select('p.date_closed')
            ->first();

        if (! $publication?->date_closed) {
            return response()->json([
                'title' => 'Edit request not allowed',
                'message' => 'No publication due date was found for this vacancy.',
            ], 422);
        }

        $expiresAt = Carbon::parse($publication->date_closed)->addDays(5)->endOfDay();

        if (now()->greaterThan($expiresAt)) {
            AppEditRequest::query()
                ->where('application_id', $application)
                ->where('vacancy_id', $vacancy)
                ->where('status', 'Open')
                ->update([
                    'status' => 'Expired',
                    'closed_at' => now(),
                    'updated_at' => now(),
                    'updated_by' => $request->user()->ipms_id,
                ]);

            return response()->json([
                'title' => 'Edit request not allowed',
                'message' => 'The edit window already closed 5 days after the publication due date.',
            ], 422);
        }

        $userIpmsId = (string) ($request->user()->ipms_id ?? '');
        $userId = (int) $request->user()->id;

        $editRequest = DB::connection('mysql')->transaction(function () use (
            $application,
            $vacancy,
            $validated,
            $expiresAt,
            $userIpmsId,
            $userId
        ) {
            $existing = AppEditRequest::query()
                ->where('application_id', $application)
                ->where('vacancy_id', $vacancy)
                ->latest('id')
                ->first();

            if ($existing) {
                $existing->fill([
                    'remarks' => $validated['remarks'],
                    'status' => 'Open',
                    'opened_at' => now(),
                    'expires_at' => $expiresAt,
                    'closed_at' => null,
                    'updated_by' => $userIpmsId,
                ])->save();

                $editRequest = $existing;
                $action = 'Updated';
            } else {
                $editRequest = AppEditRequest::query()->create([
                    'application_id' => $application,
                    'vacancy_id' => $vacancy,
                    'remarks' => $validated['remarks'],
                    'status' => 'Open',
                    'opened_at' => now(),
                    'expires_at' => $expiresAt,
                    'closed_at' => null,
                    'created_by' => $userIpmsId,
                    'updated_by' => $userIpmsId,
                ]);

                $action = 'Created';
            }

            AppEditRequestLog::query()->create([
                'app_edit_request_id' => $editRequest->id,
                'action' => $action,
                'remarks' => $validated['remarks'],
                'acted_by' => $userId,
                'acted_at' => now(),
            ]);

            return $editRequest;
        });

        if ($applicationRecord->email_address) {
            Notification::route('mail', $applicationRecord->email_address)
                ->notify(new NotifyApplicantOfEditRequest([
                    'applicant_name' => $applicationRecord->applicant_name,
                    'position' => $vacancyRecord?->position_description,
                    'remarks' => $validated['remarks'],
                    'expires_at' => $expiresAt->format('F j, Y'),
                ]));

            AppEditRequestLog::query()->create([
                'app_edit_request_id' => $editRequest->id,
                'action' => 'Email Sent',
                'remarks' => 'Edit request email notification sent.',
                'acted_by' => $userId,
                'acted_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Applicant edit request saved and notification sent.',
            'data' => [
                'status' => $editRequest->status,
                'opened_at' => optional($editRequest->opened_at)->toDateTimeString(),
                'expires_at' => optional($editRequest->expires_at)->toDateTimeString(),
                'remarks' => $editRequest->remarks,
            ],
        ]);
    }
}
