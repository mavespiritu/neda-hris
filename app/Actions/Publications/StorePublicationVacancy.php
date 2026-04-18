<?php

namespace App\Actions\Publications;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class StorePublicationVacancy
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.publications.update');
    }

    public function rules(): array
    {
        return [
            'vacancy_id' => 'required',
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'vacancy_id.required' => 'The vacancy is required.',
        ];
    }

    public function asController(int $id, Request $request)
    {

        $validator = Validator::make($request->all(), $this->rules(), $this->getValidationMessages());
        $validator->validate();

        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $conn2->table('publication_vacancies')->insert([
                'publication_id' => $id,
                'vacancy_id' => $request->vacancy_id,
                'created_by' => Auth::user()->ipms_id,
                'date_created' => Carbon::now()->format('Y-m-d H:i:s'),
            ]);

            $conn2->table('vacancy')
                ->where('id', $request->vacancy_id)
                ->update([
                    'status' => 'Close',
                ]);

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy included successfully.',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to include vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while including vacancy. Please try again.',
            ]);
        }
    }
}
