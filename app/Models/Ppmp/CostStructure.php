<?php

namespace App\Models\Ppmp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CostStructure extends Model
{
    protected $connection = 'mysql5';
    protected $table = 'ppmp_cost_structure';
    public $timestamps = false;

    protected $fillable = ['code', 'title', 'description', 'abbreviation'];
    protected $appends = ['label'];

    public function getLabelAttribute(): string
    {
        $code = trim((string) ($this->code ?? ''));
        $title = trim((string) ($this->title ?? ''));

        return $code === '' ? $title : trim($code.' - '.$title);
    }

    public function outcomes(): HasMany
    {
        return $this->hasMany(OrganizationalOutcome::class, 'cost_structure_id');
    }
}