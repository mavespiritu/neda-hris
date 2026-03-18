<?php

namespace App\Actions\Flexiplace;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreSchedule
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('store', 'flexiplace.schedule');
    }

    public function rules(): array
    {
        return [
            'emp_id' => ['required'],
            'date' => ['required', 'date'],
            'dtr_type' => ['required', 'string'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'emp_id.required' => 'The employee is required.',
            'date.required' => 'The date is required.',
            'date.date' => 'The date must be a valid date.',
            'dtr_type.required' => 'The DTR type is required.',
        ];
    }

    public function asController(Request $request)
    {
        $validated = Validator::make($request->all(), $this->rules(), $this->getValidationMessages())->validate();
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $conn2->table('flexi_schedule')->updateOrInsert(
                [
                    'emp_id' => $validated['emp_id'],
                    'date' => $validated['date'],
                ],
                [
                    'dtr_type' => $validated['dtr_type'],
                    'created_by' => $request->user()->ipms_id,
                    'date_created' => now(),
                ]
            );

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Flexiplace schedule saved successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Error recording time: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving flexiplace schedule. Please try again.',
            ]);
        }
    }
}
