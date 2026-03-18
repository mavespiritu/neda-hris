<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class GetOrganizationSettings
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('organization', 'settings');
    }

    public function asController()
    {
        $conn2 = DB::connection('mysql2');

        try {
            $settings = $conn2->table('settings')
                ->whereIn('title', [
                    'Agency Title Long',
                    'Agency Title Short',
                    'Agency Head',
                    'Agency Head Position',
                    'Agency Sub-Head',
                    'Agency Sub-Head Position',
                    'Agency Address',
                    'Agency Main Long',
                    'Agency Main Short',
                ])
                ->pluck('value', 'title');

            return response()->json([
                'agency_main_name_long' => $settings['Agency Main Long'] ?? '',
                'agency_main_name_short' => $settings['Agency Main Short'] ?? '',
                'agency_name_long' => $settings['Agency Title Long'] ?? '',
                'agency_name_short' => $settings['Agency Title Short'] ?? '',
                'agency_head' => $settings['Agency Head'] ?? '',
                'agency_head_position' => $settings['Agency Head Position'] ?? '',
                'agency_sub_head' => $settings['Agency Sub-Head'] ?? '',
                'agency_sub_head_position' => $settings['Agency Sub-Head Position'] ?? '',
                'agency_address' => $settings['Agency Address'] ?? '',
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Failed to retrieve organization settings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while retrieving organization settings. Please try again.',
            ]);
        }
    }
}
