<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class CreateRequirement
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.requirements.create');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $validator = Validator::make($request->all(), [
            'requirement' => 'required',
        ], [
            'requirement.required' => 'The requirement is required.',
        ]);

        $validator->validate();

        try {
            $conn2->beginTransaction();

            $conn2->table('vacancy_requirements')->insert([
                'vacancy_id' => $request->vacancy_id,
                'requirement' => $request->requirement,
            ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Requirement saved successfully.',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to save requirement: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while saving requirement. Please try again.',
            ]);
        }
    }
}
