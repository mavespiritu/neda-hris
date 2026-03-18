<?php

namespace App\Actions\Psgc;

use App\Models\Barangay;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowBarangay
{
    use AsAction;

    public function asController(ActionRequest $request)
    {
        try {
            $barangayCode = $request->route('barangayCode');

            $data = Barangay::query()
                ->select('code', 'name', 'cityCode', 'municipalityCode')
                ->where('code', $barangayCode)
                ->firstOrFail();

            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch barangay: ' . $e->getMessage());

            return response()->json([
                'message' => 'Unable to fetch barangay.',
            ], 500);
        }
    }
}
