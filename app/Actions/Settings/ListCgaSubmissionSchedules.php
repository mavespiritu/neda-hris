<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ListCgaSubmissionSchedules
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('competencies', 'settings');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $sort = $request->get('sort', 'year');
        $direction = $request->get('direction', 'desc');

        $sortable = [
            'year' => DB::raw('year'),
            'from_date' => DB::raw("STR_TO_DATE(SUBSTRING_INDEX(submission_dates, ' - ', 1), '%Y-%m-%d')"),
            'end_date' => DB::raw("STR_TO_DATE(SUBSTRING_INDEX(submission_dates, ' - ', -1), '%Y-%m-%d')"),
        ];

        $sortColumn = $sortable[$sort] ?? $sortable['year'];

        $schedules = $conn2->table('cga_submission_settings')
            ->orderBy($sortColumn, $direction)
            ->paginate(5);

        $schedules->getCollection()->transform(function ($item) {
            if (! empty($item->submission_dates) && str_contains($item->submission_dates, ' - ')) {
                [$fromDate, $endDate] = explode(' - ', $item->submission_dates);
                $item->from_date = $fromDate;
                $item->end_date = $endDate;
            } else {
                $item->from_date = null;
                $item->end_date = null;
            }

            return $item;
        });

        return response()->json([
            'data' => [
                'schedules' => $schedules,
            ],
        ]);
    }
}
