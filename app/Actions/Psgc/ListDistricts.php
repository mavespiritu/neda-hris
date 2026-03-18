<?php

namespace App\Actions\Psgc;

use App\Models\District;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ListDistricts
{
    use AsAction;

    public function asController(ActionRequest $request)
    {
        try {
            $data = District::query()
                ->select('code', 'name')
                ->orderBy('name')
                ->get();

            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch PSGC districts: ' . $e->getMessage());

            return response()->json([
                'message' => 'Unable to fetch districts.',
            ], 500);
        }
    }
}
