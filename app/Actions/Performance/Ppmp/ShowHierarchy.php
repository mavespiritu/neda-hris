<?php

namespace App\Actions\Performance\Ppmp;

use App\Models\Ppmp\Activity;
use App\Models\Ppmp\CostStructure;
use App\Models\Ppmp\Identifier;
use App\Models\Ppmp\OrganizationalOutcome;
use App\Models\Ppmp\Pap;
use App\Models\Ppmp\Program;
use App\Models\Ppmp\SubActivity;
use App\Models\Ppmp\SubProgram;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowHierarchy
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('libraries', 'performance');
    }

    public function asController(Request $request)
    {
        Gate::forUser($request->user())->authorize('libraries', 'performance');

        $hierarchy = CostStructure::query()
            ->with(['outcomes.programs.subPrograms.identifiers.paps.activities.subActivities'])
            ->orderBy('code')
            ->orderBy('title')
            ->get()
            ->map(fn (CostStructure $item) => $this->mapCostStructure($item))
            ->values();

        return response()->json($hierarchy);
    }

    private function mapCostStructure(CostStructure $item): array
    {
        return [
            'id' => $item->id,
            'code' => $item->code,
            'title' => $item->title,
            'label' => $item->label,
            'description' => $item->description,
            'abbreviation' => $item->abbreviation,
            'outcomes' => $item->outcomes->map(fn (OrganizationalOutcome $outcome) => $this->mapOutcome($outcome))->values(),
        ];
    }

    private function mapOutcome(OrganizationalOutcome $item): array
    {
        return [
            'id' => $item->id,
            'cost_structure_id' => $item->cost_structure_id,
            'code' => $item->code,
            'title' => $item->title,
            'label' => $item->label,
            'description' => $item->description,
            'programs' => $item->programs->map(fn (Program $program) => $this->mapProgram($program))->values(),
        ];
    }

    private function mapProgram(Program $item): array
    {
        return [
            'id' => $item->id,
            'cost_structure_id' => $item->cost_structure_id,
            'organizational_outcome_id' => $item->organizational_outcome_id,
            'code' => $item->code,
            'title' => $item->title,
            'label' => $item->label,
            'description' => $item->description,
            'sub_programs' => $item->subPrograms->map(fn (SubProgram $subProgram) => $this->mapSubProgram($subProgram))->values(),
        ];
    }

    private function mapSubProgram(SubProgram $item): array
    {
        return [
            'id' => $item->id,
            'cost_structure_id' => $item->cost_structure_id,
            'organizational_outcome_id' => $item->organizational_outcome_id,
            'program_id' => $item->program_id,
            'code' => $item->code,
            'title' => $item->title,
            'label' => $item->label,
            'description' => $item->description,
            'identifiers' => $item->identifiers->map(fn (Identifier $identifier) => $this->mapIdentifier($identifier))->values(),
        ];
    }

    private function mapIdentifier(Identifier $item): array
    {
        return [
            'id' => $item->id,
            'cost_structure_id' => $item->cost_structure_id,
            'organizational_outcome_id' => $item->organizational_outcome_id,
            'program_id' => $item->program_id,
            'sub_program_id' => $item->sub_program_id,
            'code' => $item->code,
            'title' => $item->title,
            'label' => $item->label,
            'description' => $item->description,
            'paps' => $item->paps->map(fn (Pap $pap) => $this->mapPap($pap))->values(),
        ];
    }

    private function mapPap(Pap $item): array
    {
        return [
            'id' => $item->id,
            'cost_structure_id' => $item->cost_structure_id,
            'organizational_outcome_id' => $item->organizational_outcome_id,
            'program_id' => $item->program_id,
            'sub_program_id' => $item->sub_program_id,
            'identifier_id' => $item->identifier_id,
            'short_code' => $item->short_code,
            'code' => $item->code,
            'title' => $item->title,
            'label' => $item->label,
            'description' => $item->description,
            'activities' => $item->activities->map(fn (Activity $activity) => $this->mapActivity($activity))->values(),
        ];
    }

    private function mapActivity(Activity $item): array
    {
        return [
            'id' => $item->id,
            'pap_id' => $item->pap_id,
            'code' => $item->code,
            'title' => $item->title,
            'label' => $item->label,
            'description' => $item->description,
            'sub_activities' => $item->subActivities->map(fn (SubActivity $subActivity) => $this->mapSubActivity($subActivity))->values(),
        ];
    }

    private function mapSubActivity(SubActivity $item): array
    {
        return [
            'id' => $item->id,
            'activity_id' => $item->activity_id,
            'code' => $item->code,
            'title' => $item->title,
            'label' => $item->label,
            'description' => $item->description,
        ];
    }
}