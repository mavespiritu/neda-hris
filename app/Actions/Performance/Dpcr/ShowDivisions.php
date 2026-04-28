<?php

namespace App\Actions\Performance\Dpcr;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowDivisions
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user()?->can('HRIS_performance.dpcr.page.view') ?? false;
    }

    public function asController(Request $request): JsonResponse
    {
        $user = $request->user();
        $canViewAny = $user?->can('HRIS_performance.dpcr.view.any') ?? false;
        $search = trim((string) $request->query('search', ''));

        $query = DB::connection('mysql3')
            ->table('tbldivision')
            ->select(['division_id as value', 'division_name as label', 'item_no'])
            ->whereNotNull('item_no')
            ->where('item_no', '<>', '');

        if (! $canViewAny) {
            $divisionId = $user?->division;
            if ($divisionId) {
                $query->where('division_id', $divisionId);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        if ($search !== '') {
            $query->where('division_name', 'like', "%{$search}%");
        }

        $divisions = $query
            ->orderBy('division_name')
            ->get()
            ->map(fn ($division) => [
                'value' => (string) $division->value,
                'label' => (string) $division->value,
                'item_no' => $division->item_no,
            ])
            ->values();

        return response()->json($divisions);
    }
}
