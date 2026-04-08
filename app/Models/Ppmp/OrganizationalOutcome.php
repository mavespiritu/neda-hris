<?php

namespace App\Models\Ppmp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrganizationalOutcome extends Model
{
    protected $connection = 'mysql5';
    protected $table = 'ppmp_organizational_outcome';
    public $timestamps = false;

    protected $fillable = ['cost_structure_id', 'code', 'title', 'description'];
    protected $appends = ['label', 'cost_structure_title'];

    public function costStructure(): BelongsTo
    {
        return $this->belongsTo(CostStructure::class, 'cost_structure_id');
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

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class, 'organizational_outcome_id');
    }
}