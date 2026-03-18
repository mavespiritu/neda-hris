<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class VoluntaryWorkRecordFormBuilder
{
    public function build(ConnectionInterface $connection, int $applicantId, ?int $id = null): array
    {
        if ($id === null) {
            return $this->defaults();
        }

        $record = $connection->table('applicant_voluntary_work')
            ->where('applicant_id', $applicantId)
            ->where('id', $id)
            ->first();

        abort_unless($record, 404);

        return [
            'id' => $record->id,
            'org_name' => $record->org_name ?? '',
            'org_address' => $record->org_address ?? '',
            'from_date' => $record->from_date ?? null,
            'to_date' => $record->to_date ?? null,
            'hours' => $record->hours ?? '',
            'nature_of_work' => $record->nature_of_work ?? '',
            'isPresent' => (bool) ($record->isPresent ?? false),
        ];
    }

    protected function defaults(): array
    {
        return [
            'id' => null,
            'org_name' => '',
            'org_address' => '',
            'from_date' => null,
            'to_date' => null,
            'hours' => 0,
            'nature_of_work' => '',
            'isPresent' => 0,
        ];
    }
}
