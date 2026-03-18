<?php

namespace App\Services\Applicants;

use Illuminate\Database\ConnectionInterface;

class LearningAndDevelopmentRecordFormBuilder
{
    public function build(ConnectionInterface $connection, int $applicantId, ?int $id = null): array
    {
        if ($id === null) {
            return $this->defaults();
        }

        $record = $connection->table('applicant_learning')
            ->where('applicant_id', $applicantId)
            ->where('id', $id)
            ->first();

        abort_unless($record, 404);

        return [
            'id' => $record->id,
            'seminar_title' => $record->seminar_title ?? '',
            'from_date' => $record->from_date ?? null,
            'to_date' => $record->to_date ?? null,
            'hours' => $record->hours ?? 0,
            'participation' => $record->participation ?? '',
            'type' => $record->type ?? '',
            'conducted_by' => $record->conducted_by ?? '',
        ];
    }

    protected function defaults(): array
    {
        return [
            'id' => null,
            'seminar_title' => '',
            'from_date' => null,
            'to_date' => null,
            'hours' => 0,
            'participation' => '',
            'type' => '',
            'conducted_by' => '',
        ];
    }
}
