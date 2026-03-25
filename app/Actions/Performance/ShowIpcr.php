<?php

namespace App\Actions\Performance;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowIpcr
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('ipcr', 'performance');
    }

    public function asController(Request $request): Response
    {
        $user = $request->user();
        $empId = $user?->ipms_id;

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
}
