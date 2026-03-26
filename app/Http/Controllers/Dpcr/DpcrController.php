<?php

namespace App\Http\Controllers\Dpcr;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DpcrController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user?->hasAnyRole(['HRIS_DC', 'HRIS_ADC']), 403, 'Only division chiefs and assistant division chiefs can access DPCR.');

        $divisionId = $user->division;
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

    public function store(Request $request)
    {
        abort(405);
    }

    public function show(string $id)
    {
        abort(404);
    }

    public function update(Request $request, string $id)
    {
        abort(405);
    }

    public function destroy(string $id)
    {
        abort(405);
    }
}
