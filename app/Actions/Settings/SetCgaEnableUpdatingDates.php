<?php

namespace App\Actions\Settings;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class SetCgaEnableUpdatingDates
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('competencies', 'settings');
    }

    public function asController(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'after_or_equal:startDate'],
        ], [
            'startDate.required' => 'The start date field is required.',
            'startDate.date' => 'The start date must be a valid date.',
            'endDate.after_or_equal' => 'The end date must be a date after or equal to the start date.',
        ])->validate();

        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $startDate = Carbon::parse($validated['startDate'])->startOfDay()->format('Y-m-d');
            $endDate = Carbon::parse($validated['endDate'])->endOfDay()->format('Y-m-d');

            $conn2->table('settings')
                ->where('title', 'CGA Enable Updating Dates')
                ->update([
                    'value' => $startDate . ' - ' . $endDate,
                    'updated_by' => Auth::user()->ipms_id,
                ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'CGA enable updating dates updated successfully!',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to update cga enable updating dates: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating CGA enable updating dates. Please try again.',
            ]);
        }
    }
}
