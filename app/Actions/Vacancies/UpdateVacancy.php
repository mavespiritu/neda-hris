<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateVacancy
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.update');
    }

    public function rules(): array
    {
        return [
            'type' => 'required',
            'appointment_status' => 'required',
            'item_no' => 'required_if:appointment_status,Permanent',
            'position_description' => 'required_unless:appointment_status,Permanent',
            'sg' => 'required_unless:appointment_status,Permanent',
            'monthly_salary' => 'required_unless:appointment_status,Permanent',
            'division' => 'required',
            'reports_to' => 'required_if:appointment_status,Permanent',
            'positions_supervised' => 'required_if:appointment_status,Permanent',
            'classification' => 'required_if:appointment_status,Permanent',
            'prescribed_education' => 'required_if:appointment_status,Permanent',
            'prescribed_experience' => 'required_if:appointment_status,Permanent',
            'prescribed_training' => 'required_if:appointment_status,Permanent',
            'prescribed_eligibility' => 'required_if:appointment_status,Permanent',
            'preferred_education' => 'required',
            'preferred_experience' => 'required',
            'preferred_training' => 'required',
            'preferred_eligibility' => 'required',
            'preferred_skills' => 'required_unless:appointment_status,Permanent',
            'examination' => 'required_if:appointment_status,Permanent',
            'summary' => 'required',
            'output' => 'required',
            'responsibility' => 'required',
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'type.required' => 'The type is required.',
            'appointment_status.required' => 'The status of appointment is required.',
            'item_no.required_if' => 'The plantilla item no. is required when appointment status is Permanent.',
            'position_description.required_unless' => 'The position is required unless appointment status is Permanent.',
            'sg.required_unless' => 'The salary grade is required unless appointment status is Permanent.',
            'monthly_salary.required_unless' => 'The monthly salary is required unless appointment status is Permanent.',
            'division.required' => 'The division is required.',
            'reports_to.required_if' => 'The reports to is required when appointment status is Permanent.',
            'positions_supervised.required_if' => 'The positions supervised is required when appointment status is Permanent.',
            'classifications.required_if' => 'The classifications is required when appointment status is Permanent.',
            'prescribed_education.required' => 'The prescribed education is required when appointment status is Permanent.',
            'prescribed_experience.required' => 'The prescribed experience is required when appointment status is Permanent.',
            'prescribed_training.required' => 'The prescribed training is required when appointment status is Permanent.',
            'prescribed_eligibility.required' => 'The prescribed eligibility is required when appointment status is Permanent.',
            'preferred_education.required' => 'The preferred education is required.',
            'preferred_experience.required' => 'The preferred experience is required.',
            'preferred_training.required' => 'The preferred training is required.',
            'preferred_eligibility.required' => 'The preferred eligibility is required.',
            'preferred_skills.required_unless' => 'The preferred skills is required unless appointment status is Permanent.',
            'examination.required' => 'The preferred examination is required when appointment status is Permanent.',
            'summary.required' => 'The job summary is required.',
            'output.required' => 'The job output is required.',
            'responsibility.required' => 'The duties and responsibilities is required.',
        ];
    }

    public function asController(int $id, Request $request)
    {
        $validator = Validator::make($request->all(), $this->rules(), $this->getValidationMessages());
        $validator->validate();

        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $data = Arr::except($request->all(), ['competencies']);
            $data['step'] = $request->step ?? 1;
            $data['updated_by'] = Auth::user()->ipms_id;
            $data['date_updated'] = now();
            $data['monthly_salary'] = (float) preg_replace('/[^0-9.]/', '', $data['monthly_salary']);

            $conn2->table('vacancy')->where('id', $id)->update($data);
            $conn2->table('vacancy_competencies')->where('vacancy_id', $id)->delete();

            foreach (($request->competencies ?? []) as $competencies) {
                foreach ($competencies as $competency) {
                    $conn2->table('vacancy_competencies')->insert([
                        'vacancy_id' => $id,
                        'competency_id' => $competency['id'],
                        'level' => $competency['level'],
                        'comp_type' => $competency['comp_type'],
                    ]);
                }
            }

            $conn2->commit();

            return redirect()->route('vacancies.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy updated successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to update vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the vacancy. Please try again.',
            ]);
        }
    }
}
