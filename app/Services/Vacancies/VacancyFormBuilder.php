<?php

namespace App\Services\Vacancies;

use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Collection;

class VacancyFormBuilder
{
    public function build(ConnectionInterface $connection, ?int $id = null): array
    {
        $vacancy = [
            'id' => null,
            'type' => 'New',
            'reference_no' => '',
            'appointment_status' => '',
            'item_no' => '',
            'position_description' => '',
            'position' => '',
            'sg' => '',
            'step' => '',
            'monthly_salary' => '',
            'division' => '',
            'reports_to' => '',
            'positions_supervised' => '',
            'classification' => '',
            'prescribed_education' => '',
            'prescribed_experience' => '',
            'prescribed_training' => '',
            'prescribed_eligibility' => '',
            'preferred_education' => '',
            'preferred_experience' => '',
            'preferred_training' => '',
            'preferred_eligibility' => '',
            'preferred_skills' => '',
            'examination' => '',
            'summary' => '',
            'output' => '',
            'responsibility' => '',
            'remarks' => '',
            'competencies' => [
                'organizational' => [],
                'leadership' => [],
                'functional' => [],
            ],
        ];

        if (! $id) {
            return $vacancy;
        }

        $record = $connection->table('vacancy')->where('id', $id)->first();

        if (! $record) {
            abort(404);
        }

        $vacancyCompetencies = $connection->table('vacancy_competencies as vc')
            ->leftJoin('competency as c', 'c.comp_id', '=', 'vc.competency_id')
            ->select(
                'vc.competency_id as id',
                'c.competency',
                'vc.level',
                'vc.comp_type'
            )
            ->where('vacancy_id', $id)
            ->get()
            ->groupBy('comp_type');

        return array_merge((array) $record, [
            'competencies' => [
                'organizational' => $this->mapCompetencies($vacancyCompetencies->get('org')),
                'leadership' => $this->mapCompetencies($vacancyCompetencies->get('mnt')),
                'functional' => $this->mapCompetencies($vacancyCompetencies->get('func')),
            ],
        ]);
    }

    protected function mapCompetencies(?Collection $items): array
    {
        return ($items ?? collect())
            ->values()
            ->map(fn ($item) => [
                'id' => $item->id,
                'competency' => $item->competency,
                'level' => $item->level,
                'comp_type' => $item->comp_type,
            ])
            ->all();
    }
}
