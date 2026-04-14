<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class BulkDeleteVacancy
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.delete');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $ids = $request->input('ids', []);

        try {
            $conn2->beginTransaction();

            $conn2->table('vacancy')->whereIn('id', $ids)->delete();
            $conn2->table('submission_history')
                ->whereIn('model_id', $ids)
                ->where('model', 'Vacancy')
                ->delete();

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancies deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to delete vacancies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the vacancies. Please try again.',
            ]);
        }
    }
}
