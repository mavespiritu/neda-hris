<?php

namespace App\Actions\Applications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class BulkDeleteApplication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applications.delete');
    }

    public function asController(Request $request)
    {
        $conn = DB::connection('mysql');
        $ids = $request->input('ids', []);

        try {
            $conn->beginTransaction();

            $conn->table('application')
                ->whereIn('id', $ids)
                ->delete();

            $conn->commit();

            return redirect()->route('applications.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Applications deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to delete applications: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the applications. Please try again.',
            ]);
        }
    }
}
