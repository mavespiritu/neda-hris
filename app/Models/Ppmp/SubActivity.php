<?php

namespace App\Models\Ppmp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubActivity extends Model
{
    protected $connection = 'mysql5';
    protected $table = 'ppmp_sub_activity';
    public $timestamps = false;

    protected $fillable = ['activity_id', 'code', 'title', 'description'];
    protected $appends = ['label', 'activity_title'];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function getLabelAttribute(): string
    {
        $code = trim((string) ($this->code ?? ''));
        $title = trim((string) ($this->title ?? ''));

        return $code === '' ? $title : trim($code.' - '.$title);
    }

    public function getActivityTitleAttribute(): string
    {
        return $this->activity?->label ?? '';
    }
}