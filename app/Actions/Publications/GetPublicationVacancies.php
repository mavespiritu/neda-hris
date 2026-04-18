<?php

namespace App\Actions\Publications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class GetPublicationVacancies
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.publications.update');
    }

    public function asController(int $id, Request $request)
    {

        $conn2 = DB::connection('mysql2');

        $vacancies = $conn2->table('vacancy')
            ->select(
                'vacancy.id as value',
                DB::raw("\n                    CONCAT(\n                        '[RF#: ',vacancy.reference_no,'] ',vacancy.division, ': ', vacancy.position_description,\n                        CASE\n                            WHEN vacancy.appointment_status = 'Permanent' THEN CONCAT(' (', vacancy.item_no, ')')\n                            ELSE ''\n                        END\n                    ) as label\n                ")
            )
            ->where('vacancy.status', 'Open')
            ->orderBy('vacancy.division', 'asc')
            ->orderBy('vacancy.position', 'asc')
            ->orderBy('vacancy.item_no', 'asc')
            ->get();

        return response()->json($vacancies);
    }
}
