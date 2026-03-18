<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class GetCgaEnableUpdatingDates
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('competencies', 'settings');
    }

    public function asController()
    {
        $conn2 = DB::connection('mysql2');
        $dates = $conn2->table('settings')
            ->where('title', 'CGA Enable Updating Dates')
            ->value('value');

        try {
            if ($dates) {
                [$startDate, $endDate] = explode(' - ', $dates);

                return response()->json([
                    'startDate' => $startDate,
                    'endDate' => $endDate,
                ]);
            }

            return response()->json([
                'startDate' => null,
                'endDate' => null,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to retrieve cga enable updating dates: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while retrieving CGA enable updating dates. Please try again.',
            ]);
        }
    }
}
