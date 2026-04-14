<?php

namespace App\Actions\Applications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class EditApplication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applications.update');
    }

    public function asController(int $id)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $application = $conn->table('application_applicant as aa')
            ->select([
                'a.*',
                DB::raw("CONCAT(
                    aa.last_name,
                    IF(aa.ext_name IS NOT NULL AND aa.ext_name != '', CONCAT(' ', aa.ext_name), ''),
                    ', ',
                    aa.first_name,
                    ' ',
                    IFNULL(CONCAT(LEFT(aa.middle_name, 1), '.'), '')
                ) AS name"),
                'aa.email_address',
            ])
            ->leftJoin('application as a', 'a.id', '=', 'aa.application_id')
            ->where('a.id', $id)
            ->first();

        if (! $application) {
            abort(404, 'Application not found');
        }

        $application->vacancy = $conn2->table('vacancy')
            ->where('id', $application->vacancy_id)
            ->first(['id', 'item_no', 'position_description', 'division', 'monthly_salary', 'appointment_status']);

        $application->publication = $conn2->table('publication')
            ->where('id', $application->publication_id)
            ->first(['id', 'reference_no', 'date_published', 'date_closed']);

        return Inertia::render('Applications/Edit', [
            'data' => [
                'application' => $application,
            ],
        ]);
    }
}
