<?php

namespace App\Actions\Applications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateApplication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('edit', 'applications');
    }

    public function rules(): array
    {
        return [
            'applicant_id' => ['required'],
            'vacancy_id' => ['required'],
            'date_submitted' => ['required'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'applicant_id.required' => 'The applicant field is required.',
            'vacancy_id.required' => 'The vacancy field is required.',
            'date_submitted.required' => 'The date submitted field is required.',
        ];
    }

    public function asController(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), $this->rules(), $this->getValidationMessages());
        $validated = $validator->validate();

        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $publication = $conn2->table('publication_vacancies as pv')
            ->where('pv.vacancy_id', $validated['vacancy_id'])
            ->first();

        $data = [
            'publication_id' => $publication ? $publication->publication_id : null,
            'applicant_id' => $validated['applicant_id'],
            'vacancy_id' => $validated['vacancy_id'],
            'date_submitted' => $validated['date_submitted'],
        ];

        try {
            $conn->beginTransaction();

            $conn->table('application')
                ->where('id', $id)
                ->update($data);

            $conn->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Application updated successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Error updating application: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating application. Please try again.',
            ]);
        }
    }
}
