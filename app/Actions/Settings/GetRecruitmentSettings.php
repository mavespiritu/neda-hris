<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class GetRecruitmentSettings
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('recruitment', 'settings');
    }

    public function asController()
    {
        $conn2 = DB::connection('mysql2');

        try {
            $requirements = $conn2->table('recruitment_requirements')->get();

            return response()->json([
                'requirements' => $requirements,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Failed to retrieve recruitment settings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while retrieving recruitment settings. Please try again.',
            ]);
        }
    }
}
