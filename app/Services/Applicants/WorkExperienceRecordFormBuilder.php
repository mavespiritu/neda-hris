<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class WorkExperienceRecordFormBuilder
{
    public function build(ConnectionInterface $connection, int $applicantId, ?int $id = null): array
    {
        if ($id === null) {
            return $this->defaults();
        }

        $record = $connection->table('applicant_work_experience')
            ->where('applicant_id', $applicantId)
            ->where('id', $id)
            ->first();

        abort_unless($record, 404);

        return [
            'id' => $record->id,
            'agency' => $record->agency ?? '',
            'position' => $record->position ?? '',
            'appointment' => $record->appointment ?? '',
            'from_date' => $record->from_date ?? null,
            'to_date' => $record->to_date ?? null,
            'isGovtService' => (bool) ($record->isGovtService ?? false),
            'isPresent' => (bool) ($record->isPresent ?? false),
        ];
    }

    protected function defaults(): array
    {
        return [
            'id' => null,
            'agency' => '',
            'position' => '',
            'appointment' => '',
            'from_date' => null,
            'to_date' => null,
            'isGovtService' => 0,
            'isPresent' => 0,
        ];
    }
}
