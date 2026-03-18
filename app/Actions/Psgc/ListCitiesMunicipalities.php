<?php

namespace App\Actions\Psgc;

use App\Models\Citymun;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ListCitiesMunicipalities
{
    use AsAction;

    public function asController(ActionRequest $request)
    {
        try {
            $provinceCode = $request->input('provinceCode');
            $districtCode = $request->input('districtCode');

            $query = Citymun::query()
                ->select('code', 'name', 'provinceCode', 'districtCode')
                ->orderBy('name');

            if ($districtCode) {
                $query->where('districtCode', $districtCode);
            } elseif ($provinceCode) {
                $query->where('provinceCode', $provinceCode);
            } else {
                return response()->json([
                    'message' => 'Either provinceCode or districtCode is required.',
                ], 422);
            }

            return response()->json($query->get());
        } catch (\Throwable $e) {
            Log::error('Failed to fetch PSGC cities/municipalities: ' . $e->getMessage());

            return response()->json([
                'message' => 'Unable to fetch cities and municipalities.',
            ], 500);
        }
    }
}
