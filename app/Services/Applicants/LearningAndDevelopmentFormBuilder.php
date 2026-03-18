<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class LearningAndDevelopmentFormBuilder
{
    public function build(ConnectionInterface $connection, ?int $applicantId = null): array
    {
        if ($applicantId === null) {
            return [];
        }

        return $connection->table('applicant_learning')
            ->where('applicant_id', $applicantId)
            ->orderByDesc('from_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id ?? null,
                'applicant_id' => $applicantId,
                'seminar_title' => $item->seminar_title ?? '',
                'from_date' => $item->from_date ?? '',
                'to_date' => $item->to_date ?? '',
                'hours' => $item->hours ?? '',
                'participation' => $item->participation ?? '',
                'type' => $item->type ?? '',
                'conducted_by' => $item->conducted_by ?? '',
            ])
            ->toArray();
    }
}
