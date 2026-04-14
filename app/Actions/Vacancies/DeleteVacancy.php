<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteVacancy
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.delete');
    }

    public function asController(int $id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $conn2->table('vacancy')->where('id', $id)->delete();
            $conn2->table('submission_history')
                ->where('model_id', $id)
                ->where('model', 'Vacancy')
                ->delete();

            $conn2->commit();

            return redirect()->route('vacancies.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to delete request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the vacancy. Please try again.',
            ]);
        }
    }
}
