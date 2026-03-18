<?php

namespace App\Services\Profile;

class LearningAndDevelopmentFormBuilder
{
    public function build(array $context, ?int $id = null): array
    {
        if ($id === null) {
            return $this->defaults();
        }

        $user = $context['user'];
        $type = $context['type'];
        $conn = $context['appConn'];

        $record = $conn->table('applicant_learning')
            ->select(
                'applicant_learning.id',
                'applicant_learning.seminar_title',
                'applicant_learning.from_date',
                'applicant_learning.to_date',
                'applicant_learning.hours',
                'applicant_learning.participation',
                'applicant_learning.type',
                'applicant_learning.conducted_by'
            )
            ->join('applicant', function ($join) use ($user, $type) {
                $join->on('applicant.id', '=', 'applicant_learning.applicant_id')
                    ->where('applicant.user_id', '=', $user->id)
                    ->where('applicant.type', '=', $type);
            })
            ->where('applicant_learning.id', $id)
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
