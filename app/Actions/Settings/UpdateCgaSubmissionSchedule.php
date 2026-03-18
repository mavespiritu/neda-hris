<?php

namespace App\Actions\Settings;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateCgaSubmissionSchedule
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('competencies', 'settings');
    }

    public function asController(int $id, Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validated = Validator::make($request->all(), [
            'year' => [
                'required',
                'digits:4',
                function ($attribute, $value, $fail) use ($conn2, $id) {
                    $exists = $conn2->table('cga_submission_settings')
                        ->where('year', $value)
                        ->where('id', '!=', $id)
                        ->exists();

                    if ($exists) {
                        $fail('A submission schedule already exists for this year.');
                    }
                },
            ],
            'from_date' => 'required|date',
            'end_date' => 'required|after_or_equal:from_date',
        ], [
            'year.required' => 'The year field is required.',
            'year.digits' => 'The year must be a 4-digit year.',
            'from_date.required' => 'The start date field is required.',
            'from_date.date' => 'The start date must be a valid date.',
            'end_date.required' => 'The end date field is required.',
            'end_date.date' => 'The end date must be a valid date.',
            'end_date.after_or_equal' => 'The end date must be a date after or equal to the start date.',
        ])->validate();

        try {
            $conn2->beginTransaction();

            $startDate = Carbon::parse($validated['from_date'])->startOfDay()->format('Y-m-d');
            $endDate = Carbon::parse($validated['end_date'])->endOfDay()->format('Y-m-d');

            $conn2->table('cga_submission_settings')
                ->where('id', $id)
                ->update([
                    'year' => $validated['year'],
                    'submission_dates' => $startDate . ' - ' . $endDate,
                ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Submission schedule updated successfully!',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to update submission schedule: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating schedule. Please try again.',
            ]);
        }
    }
}
