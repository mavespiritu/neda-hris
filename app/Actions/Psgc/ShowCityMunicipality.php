<?php

namespace App\Actions\Psgc;

use App\Models\Citymun;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowCityMunicipality
{
    use AsAction;

    public function asController(ActionRequest $request)
    {
        try {
            $cityMunCode = $request->route('cityMunCode');

            $data = Citymun::query()
                ->select('code', 'name', 'provinceCode', 'districtCode')
                ->where('code', $cityMunCode)
                ->firstOrFail();

            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch city/municipality: ' . $e->getMessage());

            return response()->json([
                'message' => 'Unable to fetch city or municipality.',
            ], 500);
        }
    }
}
