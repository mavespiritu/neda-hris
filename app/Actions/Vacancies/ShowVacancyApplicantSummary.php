<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowVacancyApplicantSummary
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.applicants.view');
    }

    public function asController(Request $request, int $vacancy, string $type)
    {
        $conn = DB::connection('mysql');

        $query = $this->buildQuery($conn, $vacancy, $type);
        $applicants = $query->get();

        return response()->json([
            'data' => $applicants,
        ]);
    }

    private function buildQuery($conn, int $vacancy, string $type)
    {
        $baseQuery = $conn->table('application as a')
            ->join('application_applicant as aa', 'aa.application_id', '=', 'a.id')
            ->where('a.vacancy_id', $vacancy)
            ->where('a.status', 'Submitted')
            ->when($type === 'prescreened', function ($query) {
                $query->whereExists(function ($subQuery) {
                    $subQuery->select(DB::raw(1))
                        ->from('app_assessments as ap')
                        ->whereColumn('ap.application_id', 'a.id')
                        ->where('ap.stage', 'secretariat');
                });
            })
            ->when($type === 'shortlisted', function ($query) {
                $query->whereExists(function ($subQuery) {
                    $subQuery->select(DB::raw(1))
                        ->from('app_assessments as ap')
                        ->whereColumn('ap.application_id', 'a.id')
                        ->where('ap.stage', 'hrmpsb')
                        ->where('ap.overall_status', 'Passed');
                });
            });

        if (! in_array($type, ['applicants', 'prescreened', 'shortlisted'], true)) {
            abort(404, 'Invalid applicant summary type.');
        }

        $eligibleApplications = $conn->query()
            ->fromSub(
                (clone $baseQuery)
                    ->selectRaw('MAX(a.id) as application_id, a.user_id')
                    ->groupBy('a.user_id'),
                'eligible_applications'
            )
            ->join('application as a', 'a.id', '=', 'eligible_applications.application_id')
            ->join('application_applicant as aa', 'aa.application_id', '=', 'a.id')
            ->select(
                'a.id',
                'a.user_id',
                DB::raw("UPPER(aa.last_name) AS lastname"),
                DB::raw("UPPER(aa.first_name) AS firstname"),
                DB::raw("UPPER(LEFT(aa.middle_name, 1)) AS middlename"),
                DB::raw("CONCAT(aa.last_name, ', ', aa.first_name, IF(aa.middle_name IS NULL OR aa.middle_name = '', '', CONCAT(' ', UPPER(LEFT(aa.middle_name, 1)), '.'))) AS name"),
                'aa.email_address',
                'aa.mobile_no',
                'a.date_submitted'
            )
            ->orderByDesc('a.date_submitted')
            ->orderBy('aa.last_name')
            ->orderBy('aa.first_name')
            ->orderBy('aa.middle_name');

        return $eligibleApplications;
    }
}
