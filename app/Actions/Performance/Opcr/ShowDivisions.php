<?php

namespace App\Actions\Performance\Opcr;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowDivisions
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('opcr', 'performance');
    }

    public function asController(Request $request): JsonResponse
    {
        $divisions = DB::connection('mysql3')
            ->table('tbldivision')
            ->select(['division_id as value', 'division_name as label', 'item_no'])
            ->whereNotNull('item_no')
            ->where('item_no', '<>', '')
            ->orderBy('division_name')
            ->get()
            ->values();

        return response()->json($divisions);
    }
}