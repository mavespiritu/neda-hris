<?php

namespace App\Models\Ppmp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pap extends Model
{
    protected $connection = 'mysql5';
    protected $table = 'ppmp_pap';
    public $timestamps = false;

    protected $fillable = ['cost_structure_id', 'organizational_outcome_id', 'program_id', 'sub_program_id', 'identifier_id', 'short_code', 'code', 'title', 'description'];
    protected $appends = ['label', 'identifier_title'];

    public function identifier(): BelongsTo
    {
        return $this->belongsTo(Identifier::class, 'identifier_id');
    }

    public function getLabelAttribute(): string
    {
        $shortCode = trim((string) ($this->short_code ?? ''));
        $title = trim((string) ($this->title ?? ''));

        return $shortCode === '' ? $title : trim($shortCode.' - '.$title);
    }

    public function getIdentifierTitleAttribute(): string
    {
        return $this->identifier?->label ?? '';
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'pap_id');
    }
}