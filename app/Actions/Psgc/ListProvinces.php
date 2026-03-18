<?php

namespace App\Actions\Psgc;

use App\Models\Province;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class ListProvinces
{
    use AsAction;

    public function asController(ActionRequest $request)
    {
        try {
            $data = Province::query()
                ->select('code', 'name')
                ->orderBy('name')
                ->get();

            return response()->json($data);
        } catch (\Throwable $e) {
            Log::error('Failed to fetch PSGC provinces: ' . $e->getMessage());

            return response()->json([
                'message' => 'Unable to fetch provinces.',
            ], 500);
        }
    }
}
