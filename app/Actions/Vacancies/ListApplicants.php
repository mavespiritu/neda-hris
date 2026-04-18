<?php

namespace App\Actions\Vacancies;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Lorisleiva\Actions\Concerns\AsAction;

class ListApplicants
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.applicants.view');
    }

    public function asController(Request $request, int $id)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $publication = $conn2->table('publication_vacancies as pv')
            ->join('publication as p', 'p.id', '=', 'pv.publication_id')
            ->where('pv.vacancy_id', $id)
            ->select('p.date_closed')
            ->first();

        $editRequestDeadline = $publication?->date_closed
            ? $this->addBusinessDays(Carbon::parse($publication->date_closed), 5)
            : null;

        if ($editRequestDeadline && now()->greaterThan($editRequestDeadline)) {
            $conn->table('app_edit_requests')
                ->where('vacancy_id', $id)
                ->where('status', 'Open')
                ->update([
                    'status' => 'Expired',
                    'closed_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        $search = $request->input('search', '');

        $applicantsQuery = $conn->table('application as a')
            ->join('application_applicant as aa', 'aa.application_id', '=', 'a.id')
            ->select(
                'a.id',
                'a.applicant_id',
                'a.user_id',
                DB::raw("UPPER(aa.last_name) AS lastname"),
                DB::raw("UPPER(aa.first_name) AS firstname"),
                DB::raw("UPPER(LEFT(aa.middle_name, 1)) AS middlename"),
                DB::raw("CONCAT(aa.last_name, ', ', aa.first_name, IF(aa.middle_name IS NULL OR aa.middle_name = '', '', CONCAT(' ', UPPER(LEFT(aa.middle_name, 1)), '.'))) AS name"),
                'aa.email_address',
                'aa.mobile_no',
                'a.date_submitted'
            )
            ->where('a.vacancy_id', $id)
            ->where('a.status', 'Submitted')
            ->orderBy('aa.last_name')
            ->orderBy('aa.first_name')
            ->orderBy('aa.middle_name')
            ->orderByDesc('a.id');

        if (! empty($search)) {
            $search = strtolower($search);
            $applicantsQuery->where(function ($query) use ($search) {
                $query->whereRaw('LOWER(aa.first_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(aa.last_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(aa.middle_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(aa.email_address) LIKE ?', ["%{$search}%"]);
            });
        }

        $applicants = $applicantsQuery->get();

        $assessmentStatuses = $conn->table('app_assessments')
            ->select('application_id', 'stage', 'overall_status', 'assessed_at')
            ->whereIn('application_id', $applicants->pluck('id'))
            ->get()
            ->groupBy('application_id');
        $examResults = $conn->table('app_exam_results')
            ->select('id', 'application_id', 'test_type', 'status', 'date_conducted', 'score')
            ->whereIn('application_id', $applicants->pluck('id'))
            ->get()
            ->groupBy('application_id');
        $examResultIds = $examResults->flatten(1)->pluck('id')->all();
        $examFiles = $conn2->table('file')
            ->select('id', 'itemId', 'model', 'name', 'path', 'size', 'mime')
            ->whereIn('model', ['SkillsTestResult', 'DPETestResult'])
            ->whereIn('itemId', $examResultIds)
            ->get()
            ->groupBy(fn ($file) => $file->model . ':' . $file->itemId);
        $rankingResults = $conn->table('app_ranking_results')
            ->select('application_id', 'rank', 'date_ranked')
            ->whereIn('application_id', $applicants->pluck('id'))
            ->get()
            ->keyBy('application_id');
        $editRequests = $conn->table('app_edit_requests')
            ->select('application_id', 'status', 'remarks', 'opened_at', 'expires_at', 'closed_at')
            ->whereIn('application_id', $applicants->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('application_id')
            ->keyBy('application_id');

        $applicants = $applicants->map(function ($applicant) use ($assessmentStatuses, $examResults, $examFiles, $rankingResults, $editRequests, $editRequestDeadline) {
            $statuses = $assessmentStatuses->get($applicant->id, collect())->keyBy('stage');
            $results = $examResults->get($applicant->id, collect())->keyBy('test_type');
            $skillTest = $results->get('Skill Test');
            $dpe = $results->get('DPE');
            $ranking = $rankingResults->get($applicant->id);
            $editRequest = $editRequests->get($applicant->id);
            $skillAttachment = $skillTest
                ? $examFiles->get('SkillsTestResult:' . $skillTest->id, collect())->first()
                : null;
            $dpeAttachment = $dpe
                ? $examFiles->get('DPETestResult:' . $dpe->id, collect())->first()
                : null;

            $applicant->secretariat_assessment_status = optional($statuses->get('secretariat'))->overall_status;
            $applicant->hrmpsb_assessment_status = optional($statuses->get('hrmpsb'))->overall_status;
            $applicant->secretariat_assessed_at = optional($statuses->get('secretariat'))->assessed_at;
            $applicant->hrmpsb_assessed_at = optional($statuses->get('hrmpsb'))->assessed_at;
            $applicant->rank = $ranking->rank ?? null;
            $applicant->date_ranked = $ranking->date_ranked ?? null;
            $applicant->skill_test_result = $skillTest->status ?? null;
            $applicant->skill_test_date_conducted = $skillTest->date_conducted ?? null;
            $applicant->skill_test_score = $skillTest->score ?? null;
            $applicant->skill_test_attachment = $skillAttachment ? [
                'id' => $skillAttachment->id,
                'name' => $skillAttachment->name,
                'path' => $skillAttachment->path,
                'size' => $skillAttachment->size,
                'mime' => $skillAttachment->mime,
                'preview_url' => route('files.preview', $skillAttachment->id),
            ] : null;
            $applicant->dpe_result = $dpe->status ?? null;
            $applicant->dpe_date_conducted = $dpe->date_conducted ?? null;
            $applicant->dpe_score = $dpe->score ?? null;
            $applicant->dpe_attachment = $dpeAttachment ? [
                'id' => $dpeAttachment->id,
                'name' => $dpeAttachment->name,
                'path' => $dpeAttachment->path,
                'size' => $dpeAttachment->size,
                'mime' => $dpeAttachment->mime,
                'preview_url' => route('files.preview', $dpeAttachment->id),
            ] : null;
            $applicant->edit_request_status = $editRequest->status ?? null;
            $applicant->edit_request_remarks = $editRequest->remarks ?? null;
            $applicant->edit_request_opened_at = $editRequest->opened_at ?? null;
            $applicant->edit_request_expires_at = $editRequest->expires_at ?? $editRequestDeadline?->toDateTimeString();
            $applicant->edit_request_closed_at = $editRequest->closed_at ?? null;
            $applicant->edit_request_deadline = $editRequestDeadline?->toDateTimeString();
            $applicant->can_open_edit_request = $editRequestDeadline
                ? now()->lessThanOrEqualTo($editRequestDeadline) && ! empty($applicant->email_address)
                : false;

            return $applicant;
        })
            ->sortByDesc(function ($applicant) {
                return ($applicant->date_submitted ?? '') . '|' . str_pad((string) $applicant->id, 20, '0', STR_PAD_LEFT);
            })
            ->groupBy(function ($applicant) {
                $normalize = function ($value) {
                    return strtolower(trim((string) $value));
                };

                return implode('|', [
                    $normalize($applicant->lastname ?? ''),
                    $normalize($applicant->firstname ?? ''),
                    $normalize($applicant->middlename ?? ''),
                    $normalize($applicant->user_id ?? ''),
                ]);
            })
            ->map(function ($group) {
                return $group->first();
            })
            ->sortBy([
                ['lastname', 'asc'],
                ['firstname', 'asc'],
                ['middlename', 'asc'],
            ])
            ->values();

        return response()->json([
            'data' => $applicants,
        ]);
    }

    private function addBusinessDays(Carbon $date, int $days): Carbon
    {
        $current = $date->copy()->startOfDay();
        $addedDays = 0;

        while ($addedDays < $days) {
            $current->addDay();

            if ($current->isWeekend()) {
                continue;
            }

            $addedDays++;
        }

        return $current->endOfDay();
    }
}
