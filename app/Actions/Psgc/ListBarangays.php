<?php

namespace App\Actions\Psgc;

use App\Models\Barangay;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ListBarangays
{
    use AsAction;

    public function asController(ActionRequest $request)
    {
        try {
            $cityMunCode = $request->route('cityMunCode');

            $data = Barangay::query()
                ->select('code', 'name', 'cityCode', 'municipalityCode')
                ->where(function ($query) use ($cityMunCode) {
                    $query->where('cityCode', $cityMunCode)
                        ->orWhere('municipalityCode', $cityMunCode);
                })
                ->orderBy('name')
                ->get();

            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch PSGC barangays: ' . $e->getMessage());

            return response()->json([
                'message' => 'Unable to fetch barangays.',
            ], 500);
        }
    }
}
