<?php

namespace App\Actions\Psgc;

use App\Models\Province;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowProvince
{
    use AsAction;

    public function asController(ActionRequest $request)
    {
        try {
            $provinceCode = $request->route('provinceCode');

            $data = Province::query()
                ->select('code', 'name')
                ->where('code', $provinceCode)
                ->firstOrFail();

            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch province: ' . $e->getMessage());

            return response()->json([
                'message' => 'Unable to fetch province.',
            ], 500);
        }
    }
}
