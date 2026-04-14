<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait FetchRequirementFiles
{
    protected function fetchRequirementFiles($applicantId, $vacancyId, $req, $type)
    {
        $conn = DB::connection('mysql');

        $requirementId = $this->scalarValue($req->requirement_id ?? $req->id ?? null);
        $requirementName = $this->scalarValue($req->requirement ?? $req->name ?? null);

        if ($requirementId === '' || $requirementName === '') {
            return collect();
        }

        $requirements = $conn->table('application_requirement')
            ->where('applicant_id', $applicantId)
            ->where('vacancy_id', $vacancyId)
            ->where('requirement_id', $requirementId)
            ->where('requirement', $requirementName)
            ->get();

        if ($requirements->isEmpty()) {
            return collect();
        }

        $currentFiles = $requirements->flatMap(function ($requirement) use ($conn, $vacancyId) {
            $requirementLabel = $this->scalarValue($requirement->requirement ?? null);

            return $conn->table('file')
                ->where('model', 'Vacancy_' . $vacancyId . '_' . $requirementLabel)
                ->where('itemId', $requirement->id)
                ->get();
        });

        if ($currentFiles->isNotEmpty()) {
            return $currentFiles;
        }

        if ($type === 'manual') {
            return collect();
        }

        if ($type === 'reuse') {
            $latestApp = $conn->table('application')
                ->where('user_id', auth()->id())
                ->where('status', 'Submitted')
                ->latest('date_submitted')
                ->first();

            if ($latestApp) {
                $latestRequirements = $conn->table('application_requirement')
                    ->where('applicant_id', $applicantId)
                    ->where('vacancy_id', $latestApp->vacancy_id)
                    ->where('requirement_id', $requirementId)
                    ->where('requirement', $requirementName)
                    ->get();

                return $latestRequirements->flatMap(function ($requirement) use ($conn, $latestApp) {
                    $requirementLabel = $this->scalarValue($requirement->requirement ?? null);

                    return $conn->table('file')
                        ->where('model', 'Vacancy_' . $latestApp->vacancy_id . '_' . $requirementLabel)
                        ->where('itemId', $requirement->id)
                        ->get();
                });
            }
        }

        return collect();
    }

    protected function scalarValue(mixed $value): string
    {
        if (is_object($value)) {
            foreach (['requirement', 'name', 'value', 'label'] as $key) {
                if (isset($value->{$key}) && ! is_object($value->{$key}) && ! is_array($value->{$key})) {
                    return trim((string) $value->{$key});
                }
            }

            return '';
        }

        if (is_array($value)) {
            foreach (['requirement', 'name', 'value', 'label'] as $key) {
                if (array_key_exists($key, $value) && ! is_object($value[$key]) && ! is_array($value[$key])) {
                    return trim((string) $value[$key]);
                }
            }

            return '';
        }

        return trim((string) $value);
    }
}
