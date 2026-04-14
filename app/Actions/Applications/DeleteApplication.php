<?php

namespace App\Actions\Applications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteApplication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applications.delete');
    }

    public function asController(int $id)
    {
        $conn = DB::connection('mysql');

        try {
            $conn->beginTransaction();

            $conn->table('application')
                ->where('id', $id)
                ->delete();

            $conn->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Application deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn->rollBack();
            Log::error('Failed to delete application: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the application. Please try again.',
            ]);
        }
    }
}
