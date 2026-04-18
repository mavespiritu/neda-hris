<?php

namespace App\Support\Workflows\TravelRequest;

use Illuminate\Support\Facades\DB;

final class WorkflowActorResolver
{
    private const GLOBAL_TYPES = ['Reviewer_VR'];

    /**
     * @return array<int, array{emp_id:string,name:?string,source:string}>
     */
    public function resolveTravelRequestActors(string $state, array $context = []): array
    {
        $creatorId = (string) ($context['creator_id'] ?? '');
        $division = (string) ($context['creator_division'] ?? '');
        $actorType = $this->actorTypeForState($state);

        return match ($actorType) {
            'creator' => $creatorId !== '' ? [[
                'emp_id' => $creatorId,
                'name' => $context['creator_name'] ?? null,
                'source' => 'creator',
            ]] : [],
            'reviewer' => $this->signatoryActors('Reviewer_VR', $division),
            'return-creator' => $creatorId !== '' ? [[
                'emp_id' => $creatorId,
                'name' => $context['creator_name'] ?? null,
                'source' => 'return_to_creator',
            ]] : [],
            'resubmitter' => $creatorId !== '' ? [[
                'emp_id' => $creatorId,
                'name' => $context['creator_name'] ?? null,
                'source' => 'resubmitter',
            ]] : [],
            default => [],
        };
    }

    /**
     * @return array<int, array{emp_id:string,name:?string,source:string}>
     */
    public function resolveByLabel(string $label, array $context = []): array
    {
        $label = trim($label);

        return match ($label) {
            'Creator' => $this->resolveTravelRequestActors('Draft', $context),
            'Reviewer_VR' => $this->resolveTravelRequestActors('Submitted', $context),
            default => [],
        };
    }

    /**
     * @return array<int, array{emp_id:string,name:?string,source:string}>
     */
    private function signatoryActors(string $type, string $division = ''): array
    {
        $query = DB::connection('mysql2')
            ->table('travel_order_signatories')
            ->where('type', $type);

        if ($division !== '' && ! in_array($type, self::GLOBAL_TYPES, true)) {
            $query->where('division', $division);
        }

        $empIds = $query->pluck('signatory')
            ->filter()
            ->map(fn ($value) => (string) $value)
            ->unique()
            ->values();

        if ($empIds->isEmpty()) {
            return [];
        }

        $employees = DB::connection('mysql3')
            ->table('tblemployee')
            ->select([
                'emp_id',
                DB::raw("CONCAT(fname, ' ', IF(mname IS NOT NULL AND TRIM(mname) <> '', CONCAT(LEFT(TRIM(mname), 1), '.'), ''), ' ', lname) as name"),
            ])
            ->whereIn('emp_id', $empIds)
            ->get()
            ->keyBy('emp_id');

        return $empIds->map(function (string $empId) use ($employees, $type) {
            return [
                'emp_id' => $empId,
                'name' => isset($employees[$empId]) ? trim((string) $employees[$empId]->name) : null,
                'source' => $type,
            ];
        })->values()->all();
    }

    private function actorTypeForState(string $state): string
    {
        return match ($state) {
            'Draft' => 'creator',
            'Submitted' => 'reviewer',
            'Returned' => 'return-creator',
            'Resubmitted' => 'resubmitter',
            default => 'unknown',
        };
    }
}
