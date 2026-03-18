<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class VoluntaryWorkFormBuilder
{
    public function build(ConnectionInterface $connection, ?int $applicantId = null): array
    {
        if ($applicantId === null) {
            return [];
        }

        return $connection->table('applicant_voluntary_work')
            ->where('applicant_id', $applicantId)
            ->orderByDesc('from_date')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id ?? null,
                'applicant_id' => $applicantId,
                'org_name' => $item->org_name ?? '',
                'org_address' => $item->org_address ?? '',
                'from_date' => $item->from_date ?? '',
                'to_date' => $item->to_date ?? '',
                'hours' => $item->hours ?? '',
                'nature_of_work' => $item->nature_of_work ?? '',
                'isPresent' => (bool) ($item->isPresent ?? false),
            ])
            ->toArray();
    }
}
