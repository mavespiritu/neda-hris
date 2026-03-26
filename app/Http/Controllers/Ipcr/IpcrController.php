<?php

namespace App\Http\Controllers\Ipcr;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class IpcrController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user?->hasRole('HRIS_Staff'), 403, 'Only staff users can access IPCR.');

        $empId = $user->ipms_id;
        $connection = DB::connection('mysql3');
        $performanceConnection = DB::connection('mysql2');

        $records = collect();

        if ($empId) {
            $records = $connection->table('tblemp_ipcr')
                ->select([
                    'id',
                    'semester',
                    'year',
                    'verified_by',
                ])
                ->where('emp_id', $empId)
                ->orderByDesc('year')
                ->orderByDesc('semester')
                ->get()
                ->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'semester' => $record->semester,
                        'year' => $record->year,
                        'verified_by' => $record->verified_by,
                        'label' => 'IPCR for '.($record->semester == 1 ? '1st' : '2nd').' Semester '.$record->year,
                        'status' => $record->verified_by ? 'Verified' : 'For Review',
                    ];
                })
                ->values();
        }

        $summary = [
            'total_records' => $records->count(),
            'verified_records' => $records->where('status', 'Verified')->count(),
            'evidence_count' => $empId
                ? $performanceConnection->table('staff_competency_indicator_evidence')
                    ->where('emp_id', $empId)
                    ->where('reference', 'Performance')
                    ->count()
                : 0,
            'latest_label' => $records->first()['label'] ?? 'No IPCR record yet',
        ];

        return Inertia::render('Ipcr/index', [
            'records' => $records,
            'summary' => $summary,
            'emailLink' => route('emails.index'),
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
