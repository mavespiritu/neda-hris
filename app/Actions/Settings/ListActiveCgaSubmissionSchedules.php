<?php

namespace App\Actions\Settings;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ListActiveCgaSubmissionSchedules
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('activeCgaSchedules', 'settings');
    }

    public function asController()
    {
        $conn2 = DB::connection('mysql2');
        $today = Carbon::today();

        $schedules = $conn2->table('cga_submission_settings')
            ->orderByDesc('year')
            ->get()
            ->filter(function ($item) use ($today) {
                if (! empty($item->submission_dates) && str_contains($item->submission_dates, ' - ')) {
                    [$fromDate, $endDate] = explode(' - ', $item->submission_dates);
                    $from = Carbon::parse($fromDate);
                    $to = Carbon::parse($endDate);
                    return $today->between($from, $to);
                }
                return false;
            })
            ->map(function ($item) {
                [$fromDate, $endDate] = explode(' - ', $item->submission_dates);
                $item->from_date = $fromDate;
                $item->end_date = $endDate;
                $item->from_date_formatted = Carbon::parse($fromDate)->format('F j, Y');
                $item->end_date_formatted = Carbon::parse($endDate)->format('F j, Y');
                return $item;
            })
            ->values();

        return response()->json(['data' => $schedules]);
    }
}
