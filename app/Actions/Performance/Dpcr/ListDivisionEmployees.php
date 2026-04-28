<?php

namespace App\Actions\Performance\Dpcr;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class ListDivisionEmployees
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user()?->can('HRIS_performance.dpcr.page.view') ?? false;
    }

    public function asController(Request $request): JsonResponse
    {
        $divisionId = trim((string) $request->query('division_id', ''));
        $empTypeId = $request->query('emp_type_id', 'Permanent');

        $query = DB::connection('mysql3')
            ->table('tblemployee')
            ->select([
                'emp_id as value',
                'lname',
                'fname',
                'mname',
                'division_id',
            ])
            ->where('work_status', 'active')
            ->where('emp_type_id', $empTypeId);

        if ($divisionId !== '') {
            $query->where('division_id', $divisionId);
        }

        $employees = $query
            ->orderBy('lname', 'asc')
            ->orderBy('fname', 'asc')
            ->orderBy('mname', 'asc')
            ->get()
            ->map(fn ($employee) => [
                'value' => (string) $employee->value,
                'label' => $this->employeeFullName($employee),
                'division_id' => (string) ($employee->division_id ?? ''),
            ])
            ->values();

        return response()->json($employees);
    }

    private function employeeFullName(object $employee): string
    {
        $first = trim((string) ($employee->fname ?? ''));
        $middle = trim((string) ($employee->mname ?? ''));
        $last = trim((string) ($employee->lname ?? ''));
        $ext = trim((string) ($employee->ext_name ?? ''));

        $parts = [];

        if ($first !== '') {
            $parts[] = $first;
        }

        if ($middle !== '') {
            $parts[] = mb_substr($middle, 0, 1) . '.';
        }

        if ($last !== '') {
            $parts[] = $last;
        }

        if ($ext !== '') {
            $parts[] = $ext;
        }

        return trim(implode(' ', $parts)) ?: (string) ($employee->value ?? '');
    }
}
