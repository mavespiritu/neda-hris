<?php

namespace App\Actions\Flexiplace;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class BulkStoreSchedule
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('bulkStore', 'flexiplace.schedule');
    }

    public function rules(): array
    {
        return [
            'employees' => ['required', 'array', 'min:1'],
            'dates' => ['required', 'array', 'min:1'],
            'dtr_type' => ['required', 'string'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'employees.required' => 'Please select at least one employee.',
            'employees.min' => 'You must select at least one employee.',
            'dates.required' => 'Please select at least one date.',
            'dates.min' => 'You must select at least one date.',
            'dtr_type.required' => 'The DTR type is required.',
        ];
    }

    public function asController(Request $request)
    {
        $validated = Validator::make($request->all(), $this->rules(), $this->getValidationMessages())->validate();
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            foreach ($validated['employees'] as $empId) {
                foreach ($validated['dates'] as $date) {
                    $conn2->table('flexi_schedule')->updateOrInsert(
                        [
                            'emp_id' => $empId,
                            'date' => $date,
                        ],
                        [
                            'dtr_type' => $validated['dtr_type'],
                            'created_by' => $request->user()->ipms_id,
                            'date_created' => now(),
                        ]
                    );
                }
            }

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Flexiplace schedule saved successfully for selected employees and dates.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Bulk Store Error: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving schedules. Please try again.',
            ]);
        }
    }
}
