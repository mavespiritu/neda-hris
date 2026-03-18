<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateOrganizationSettings
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('organization', 'settings');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');

        $fields = [
            'Agency Main Long' => $request->input('agency_main_name_long'),
            'Agency Main Short' => $request->input('agency_main_name_short'),
            'Agency Title Long' => $request->input('agency_name_long'),
            'Agency Title Short' => $request->input('agency_name_short'),
            'Agency Head' => $request->input('agency_head'),
            'Agency Head Position' => $request->input('agency_head_position'),
            'Agency Sub-Head' => $request->input('agency_sub_head'),
            'Agency Sub-Head Position' => $request->input('agency_sub_head_position'),
            'Agency Address' => $request->input('agency_address'),
        ];

        try {
            $conn2->beginTransaction();

            foreach ($fields as $title => $value) {
                $conn2->table('settings')->updateOrInsert(
                    ['title' => $title],
                    ['value' => $value]
                );
            }

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Organization settings updated',
                'message' => 'Organization settings were successfully updated.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to update organization settings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Update failed',
                'message' => 'An error occurred while updating organization settings.',
            ]);
        }
    }
}
