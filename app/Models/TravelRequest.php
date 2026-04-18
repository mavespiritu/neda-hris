<?php

namespace App\Models;

use App\States\TravelRequest\Draft;
use App\States\TravelRequest\Resubmitted;
use App\States\TravelRequest\Returned;
use App\States\TravelRequest\Submitted;
use App\States\TravelRequest\TravelRequestState;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TravelRequest extends Model
{
    use HasFactory;

    protected $connection = 'mysql2';
    protected $table = 'travel_order';
    public $timestamps = false;

    protected $casts = [
        'tr_state' => TravelRequestState::class,
    ];

    public function getStateAttribute()
    {
        return $this->tr_state;
    }

    public function setStateAttribute($value): void
    {
        $this->setAttribute('tr_state', $value);
    }

    public function isDraft(): bool
    {
        return $this->state instanceof Draft;
    }

    public function isSubmitted(): bool
    {
        return $this->state instanceof Submitted;
    }

    public function isReturned(): bool
    {
        return $this->state instanceof Returned;
    }

    public function isResubmitted(): bool
    {
        return $this->state instanceof Resubmitted;
    }

    public function isSubmittable(): bool
    {
        return $this->isDraft();
    }

    public function isReturnable(): bool
    {
        return $this->isSubmitted();
    }

    public function isResubmittable(): bool
    {
        return $this->isReturned();
    }

    public function isEditable(): bool
    {
        return $this->isDraft() || $this->isReturned();
    }

    public function isDeletable(): bool
    {
        return $this->isEditable();
    }

    public function isGeneratable(): bool
    {
        return $this->isSubmitted();
    }

    public function canTakeAction(string $action): bool
    {
        return match (strtolower(trim($action))) {
            'submit' => $this->isSubmittable(),
            'return' => $this->isReturnable(),
            'resubmit' => $this->isResubmittable(),
            default => false,
        };
    }

    public function statusLabel(): string
    {
        return $this->state?->label() ?? 'Draft';
    }

    public function scopeRequestType(Builder $query, string $requestType): Builder
    {
        return $query->where('request_type', $requestType);
    }

    public function scopeVisibleToEmployee(Builder $query, string $employeeId): Builder
    {
        return $query->where(function (Builder $w) use ($employeeId) {
            $w->where('travel_order.created_by', $employeeId)
                ->orWhereExists(function (Builder $sq) use ($employeeId) {
                    $sq->selectRaw('1')
                        ->from('travel_order_staffs as s')
                        ->whereColumn('s.travel_order_id', 'travel_order.id')
                        ->where('s.emp_id', $employeeId);
                });
        });
    }

    public function scopeVisibleToDivision(Builder $query, string $division): Builder
    {
        return $query->where('division', $division);
    }
}
