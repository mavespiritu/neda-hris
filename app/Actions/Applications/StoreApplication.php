<?php

namespace App\Actions\Applications;

use App\Traits\CopiesApplicationData;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreApplication
{
    use AsAction;
    use CopiesApplicationData;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applications.create');
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

    public function asController(Request $request)
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
            'date_created' => Carbon::now(),
            'type' => 'Manual',
            'date_submitted' => $validated['date_submitted'],
            'status' => 'Submitted',
        ];

        try {
            $conn->beginTransaction();

            $applicationId = $conn->table('application')->insertGetId($data);

            $conn->table('application_status')->insert([
                'application_id' => $applicationId,
                'status' => 'Application Received',
                'created_by' => $request->user()->id,
                'created_at' => now(),
            ]);

            $copies = [
                ['applicant', 'application_applicant', true],
                ['applicant_child', 'application_child'],
                ['applicant_education', 'application_education'],
                ['applicant_eligibility', 'application_eligibility'],
                ['applicant_father', 'application_father', true],
                ['applicant_learning', 'application_learning'],
                ['applicant_mother', 'application_mother', true],
                ['applicant_other_info', 'application_other_info'],
                ['applicant_question', 'application_question'],
                ['applicant_reference', 'application_reference'],
                ['applicant_spouse', 'application_spouse', true],
                ['applicant_voluntary_work', 'application_voluntary_work'],
                ['applicant_work_experience', 'application_work_experience'],
            ];

            foreach ($copies as $copy) {
                [$source, $target, $single] = array_pad($copy, 3, null);
                $this->copiesApplicationData($source, $target, $validated['applicant_id'], $applicationId, $single);
            }

            $conn->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Application created successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Error creating application: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while creating application. Please try again.',
            ]);
        }
    }
}
