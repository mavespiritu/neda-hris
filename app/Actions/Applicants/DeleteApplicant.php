<?php

namespace App\Actions\Applicants;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteApplicant
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.delete');
    }

    public function asController(int $id)
    {
        $conn = DB::connection('mysql');

        try {
            $conn->beginTransaction();

            $conn->table('applicant')
                ->where('id', $id)
                ->delete();

            $conn->commit();

            return redirect()->route('applicants.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Applicant deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to delete applicant: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the applicant. Please try again.',
            ]);
        }
    }
}
