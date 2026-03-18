<?php

namespace App\Services\Profile;

class VoluntaryWorkFormBuilder
{
    public function build(array $context, ?int $id = null): array
    {
        if ($id === null) {
            return $this->defaults();
        }

        $user = $context['user'];
        $type = $context['type'];
        $conn = $context['appConn'];

        $record = $conn->table('applicant_voluntary_work')
            ->select(
                'applicant_voluntary_work.id',
                'applicant_voluntary_work.org_name',
                'applicant_voluntary_work.org_address',
                'applicant_voluntary_work.from_date',
                'applicant_voluntary_work.to_date',
                'applicant_voluntary_work.hours',
                'applicant_voluntary_work.nature_of_work',
                'applicant_voluntary_work.isPresent'
            )
            ->join('applicant', function ($join) use ($user, $type) {
                $join->on('applicant.id', '=', 'applicant_voluntary_work.applicant_id')
                    ->where('applicant.user_id', '=', $user->id)
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant_voluntary_work.id', $id)
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
            'isPresent' => $record->isPresent ?? null,
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
            'isGovtService' => 0,
            'isPresent' => 0,
        ];
    }
}
