<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class BulkDeleteCgaSubmissionSchedules
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('competencies', 'settings');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $deleted = $conn2->table('cga_submission_settings')
                ->whereIn('id', $request->input('ids', []))
                ->delete();

            $conn2->commit();

            return redirect()->back()->with($deleted ? [
                'status' => 'success',
                'title' => 'Deleted!',
                'message' => 'Selected submission schedules have been deleted successfully.',
            ] : [
                'status' => 'error',
                'title' => 'Not Found',
                'message' => 'Selected submission schedules not found or already deleted.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Error bulk deleting submission schedules: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh!',
                'message' => 'An error occurred while deleting submission schedules. Please try again.',
            ]);
        }
    }
}
