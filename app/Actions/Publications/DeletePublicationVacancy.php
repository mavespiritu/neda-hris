<?php

namespace App\Actions\Publications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class DeletePublicationVacancy
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

        try {
            $conn2->beginTransaction();

            $conn2->table('publication_vacancies')
                ->where('id', $id)
                ->delete();

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Vacancy removed successfully.',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to remove vacancy: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while removing the vacancy. Please try again.',
            ]);
        }
    }
}
