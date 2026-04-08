<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Ppmp\Identifier;

class PerformancePap extends Model
{
    protected $connection = 'mysql5';

    protected $table = 'ppmp_pap';

    public $timestamps = false;

    protected $fillable = [
        'short_code',
        'title',
    ];

    protected $appends = [
        'label',
        'activity',
        'program_title',
    ];

    public function identifier(): BelongsTo
    {
        return $this->belongsTo(Identifier::class, 'identifier_id');
    }

    public function getLabelAttribute(): string
    {
        $shortCode = trim((string) ($this->short_code ?? ''));
        $title = trim((string) ($this->title ?? ''));

        if ($shortCode === '') {
            return $title;
        }

        return trim($shortCode . ' - ' . $title);
    }

    public function getActivityAttribute(): string
    {
        return $this->label;
    }

    public function getProgramTitleAttribute(): string
    {
        return $this->identifier?->subProgram?->program?->label ?? '';
    }
}
