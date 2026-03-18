<?php

namespace App\Actions\Psgc;

use App\Models\District;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowDistrict
{
    use AsAction;

    public function asController(ActionRequest $request)
    {
        try {
            $districtCode = $request->route('districtCode');

            $data = District::query()
                ->select('code', 'name')
                ->where('code', $districtCode)
                ->firstOrFail();

            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch district: ' . $e->getMessage());

            return response()->json([
                'message' => 'Unable to fetch district.',
            ], 500);
        }
    }
}
