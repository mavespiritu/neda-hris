<?php

namespace App\Traits;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

trait BuildsEmployeeNameMap
{
    protected function employeeNamesById(Collection|array $empIds, string $connection = 'mysql3'): Collection
    {
        $ids = collect($empIds)
            ->flatten()
            ->filter(fn ($v) => $v !== null && $v !== '')
            ->map(fn ($v) => (string) $v)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        $cacheKey = 'messenger:employee-names:' . $connection . ':' . md5($ids->implode(','));

        return Cache::store('redis')->remember($cacheKey, now()->addHours(12), function () use ($connection, $ids) {
            return DB::connection($connection)->table('tblemployee')
                ->select([
                    'emp_id',
                    DB::raw("
                        CONCAT(
                            fname,
                            IF(mname IS NOT NULL AND TRIM(mname) <> '', CONCAT(' ', LEFT(TRIM(mname), 1), '.'), ''),
                            ' ',
                            lname
                        ) as name
                    "),
                ])
                ->whereIn('emp_id', $ids)
                ->get()
                ->keyBy('emp_id');
        });
    }

    protected function employeeName(Collection $employeesById, $empId): ?string
    {
        $key = (string) ($empId ?? '');
        if ($key === '') return null;

        $name = $employeesById[$key]->name ?? null;
        return $name ? trim($name) : null;
    }

    protected function employeeGenderById($empIds, string $connection = 'mysql3'): array
    {
        $ids = collect($empIds)->filter()->unique()->values();
        if ($ids->isEmpty()) return [];

        $cacheKey = 'messenger:employee-genders:' . $connection . ':' . md5($ids->implode(','));

        return Cache::store('redis')->remember($cacheKey, now()->addHours(12), function () use ($connection, $ids) {
            return DB::connection($connection)
                ->table('tblemployee')
                ->whereIn('emp_id', $ids)
                ->pluck('gender', 'emp_id')
                ->map(fn ($v) => $v ? trim((string) $v) : null)
                ->all();
        });
    }
}
