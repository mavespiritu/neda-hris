<?php

namespace App\Models\Ppmp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubProgram extends Model
{
    protected $connection = 'mysql5';
    protected $table = 'ppmp_sub_program';
    public $timestamps = false;

    protected $fillable = ['cost_structure_id', 'organizational_outcome_id', 'program_id', 'code', 'title', 'description'];
    protected $appends = ['label', 'cost_structure_title', 'organizational_outcome_title', 'program_title'];

    public function costStructure(): BelongsTo
    {
        return $this->belongsTo(CostStructure::class, 'cost_structure_id');
    }

    public function organizationalOutcome(): BelongsTo
    {
        return $this->belongsTo(OrganizationalOutcome::class, 'organizational_outcome_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function getLabelAttribute(): string
    {
        $code = trim((string) ($this->code ?? ''));
        $title = trim((string) ($this->title ?? ''));

        return $code === '' ? $title : trim($code.' - '.$title);
    }

    public function getCostStructureTitleAttribute(): string
    {
        return $this->costStructure?->label ?? '';
    }

    public function getOrganizationalOutcomeTitleAttribute(): string
    {
        return $this->organizationalOutcome?->label ?? '';
    }

    public function getProgramTitleAttribute(): string
    {
        return $this->program?->label ?? '';
    }

    public function identifiers(): HasMany
    {
        return $this->hasMany(Identifier::class, 'sub_program_id');
    }
}