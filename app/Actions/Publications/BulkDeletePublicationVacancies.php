<?php

namespace App\Actions\Publications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class BulkDeletePublicationVacancies
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.publications.update');
    }

    public function asController(int $id, Request $request)
    {

        $conn2 = DB::connection('mysql2');
        $ids = $request->input('ids');

        try {
            $conn2->beginTransaction();

            $conn2->table('publication_vacancies')
                ->where('publication_id', $id)
                ->whereIn('id', $ids)
                ->delete();

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancies removed successfully.',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to remove vacancies: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while removing vacancies. Please try again.',
            ]);
        }
    }
}
