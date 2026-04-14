<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteRequirement
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.requirements.delete');
    }

    public function asController(Request $request, int $id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('vacancy_requirements')->where('id', $id)->delete();

            $conn2->commit();

            if ($deleted) {
                return redirect()->back()->with([
                    'status' => 'success',
                    'title' => 'Deleted!',
                    'message' => 'Requirement has been deleted successfully.',
                ]);
            }

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Not Found',
                'message' => 'Requirement not found or already deleted.',
            ]);
        } catch (\Exception $e) {
            $conn2->rollBack();
            Log::error('Failed to delete requirement: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the requirement. Please try again.',
            ]);
        }
    }
}
