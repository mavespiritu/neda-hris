<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class EducationalBackgroundFormBuilder
{
    private const LEVELS = [
        'elementary' => 'Elementary',
        'secondary' => 'Secondary',
        'vocational' => 'Vocational/Trade Course',
        'college' => 'College',
        'graduate' => 'Graduate Studies',
    ];

    public function build(ConnectionInterface $connection, ?int $applicantId = null): array
    {
        $payload = [
            'elementary' => [],
            'secondary' => [],
            'vocational' => [],
            'college' => [],
            'graduate' => [],
        ];

        if ($applicantId === null) {
            return $payload;
        }

        $educations = $connection->table('applicant_education')
            ->where('applicant_id', $applicantId)
            ->orderByDesc('from_year')
            ->get();

        foreach ($educations as $education) {
            $levelKey = $this->normalizeLevel($education->level ?? '');

            if ($levelKey === null) {
                continue;
            }

            $payload[$levelKey][] = [
                'id' => $education->id ?? null,
                'applicant_id' => $applicantId,
                'level' => $education->level ?? self::LEVELS[$levelKey],
                'school' => $education->school ?? '',
                'course' => $education->course ?? '',
                'highest_attainment' => $education->highest_attainment ?? '',
                'from_year' => $education->from_year ?? '',
                'to_year' => $education->to_year ?? '',
                'year_graduated' => $education->year_graduated ?? '',
                'award' => $education->award ?? '',
                'is_graduated' => (bool) ($education->is_graduated ?? false),
            ];
        }

        return $payload;
    }

    public static function levels(): array
    {
        return self::LEVELS;
    }

    private function normalizeLevel(string $level): ?string
    {
        $normalized = strtolower(trim($level));

        return match ($normalized) {
            'elementary' => 'elementary',
            'secondary' => 'secondary',
            'vocational',
            'vocational/trade course' => 'vocational',
            'college' => 'college',
            'graduate',
            'graduate studies' => 'graduate',
            default => null,
        };
    }
}
