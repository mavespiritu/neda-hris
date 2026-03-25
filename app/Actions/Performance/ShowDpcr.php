<?php

namespace App\Actions\Performance;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowDpcr
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('dpcr', 'performance');
    }

    public function asController(Request $request): Response
    {
        $user = $request->user();
        $divisionId = $user?->division;
        $connection = DB::connection('mysql3');

        $divisionName = $divisionId
            ? $connection->table('tbldivision')->where('division_id', $divisionId)->value('division_name')
            : null;

        return Inertia::render('Dpcr/index', [
            'divisionName' => $divisionName,
            'divisionId' => $divisionId,
            'summary' => [
                'kra_count' => 4,
                'unit_count' => 1,
                'monitoring_link' => route('emails.index'),
            ],
        ]);
    }
}
