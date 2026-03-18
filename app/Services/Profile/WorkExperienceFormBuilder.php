<?php

namespace App\Services\Profile;

class WorkExperienceFormBuilder
{
    public function build(array $context, ?int $id = null): array
    {
        if ($id === null) {
            return $this->defaults();
        }

        $user = $context['user'];
        $type = $context['type'];
        $conn = $context['appConn'];

        $record = $conn->table('applicant_work_experience')
            ->select(
                'applicant_work_experience.id',
                'applicant_work_experience.agency',
                'applicant_work_experience.position',
                'applicant_work_experience.appointment',
                'applicant_work_experience.from_date',
                'applicant_work_experience.to_date',
                'applicant_work_experience.isGovtService',
                'applicant_work_experience.isPresent'
            )
            ->join('applicant', function ($join) use ($user, $type) {
                $join->on('applicant.id', '=', 'applicant_work_experience.applicant_id')
                    ->where('applicant.user_id', '=', $user->id)
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant_work_experience.id', $id)
            ->first();

        abort_unless($record, 404);

        return [
            'id' => $record->id,
            'agency' => $record->agency ?? '',
            'position' => $record->position ?? '',
            'appointment' => $record->appointment ?? '',
            'from_date' => $record->from_date ?? null,
            'to_date' => $record->to_date ?? null,
            'isGovtService' => $record->isGovtService ?? null,
            'isPresent' => $record->isPresent ?? null,
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
