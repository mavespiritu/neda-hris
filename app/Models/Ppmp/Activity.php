<?php

namespace App\Models\Ppmp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Activity extends Model
{
    protected $connection = 'mysql5';
    protected $table = 'ppmp_activity';
    public $timestamps = false;

    protected $fillable = ['pap_id', 'code', 'title', 'description'];
    protected $appends = ['label', 'pap_title'];

    public function pap(): BelongsTo
    {
        return $this->belongsTo(Pap::class, 'pap_id');
    }

    public function getLabelAttribute(): string
    {
        $code = trim((string) ($this->code ?? ''));
        $title = trim((string) ($this->title ?? ''));

        return $code === '' ? $title : trim($code.' - '.$title);
    }

    public function getPapTitleAttribute(): string
    {
        return $this->pap?->label ?? '';
    }

    public function subActivities(): HasMany
    {
        return $this->hasMany(SubActivity::class, 'activity_id');
    }
}