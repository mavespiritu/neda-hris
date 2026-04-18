<?php

namespace App\Models;

use App\States\VehicleRequest\Approved;
use App\States\VehicleRequest\Draft;
use App\States\VehicleRequest\Endorsed;
use App\States\VehicleRequest\Reviewed;
use App\States\VehicleRequest\Resubmitted;
use App\States\VehicleRequest\Returned;
use App\States\VehicleRequest\Submitted;
use App\States\VehicleRequest\VehicleAuthorized;
use App\States\VehicleRequest\VehicleRequestState;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleRequest extends Model
{
    use HasFactory;

    protected $connection = 'mysql2';
    protected $table = 'travel_order';
    public $timestamps = false;

    protected $casts = [
        'vr_state' => VehicleRequestState::class,
    ];

    public function getStateAttribute()
    {
        return $this->vr_state;
    }

    public function setStateAttribute($value): void
    {
        $this->setAttribute('vr_state', $value);
    }

    public function isDraft(): bool
    {
        return $this->state instanceof Draft;
    }

    public function isSubmitted(): bool
    {
        return $this->state instanceof Submitted;
    }

    public function isEndorsed(): bool
    {
        return $this->state instanceof Endorsed;
    }

    public function isReviewed(): bool
    {
        return $this->state instanceof Reviewed;
    }

    public function isApproved(): bool
    {
        return $this->state instanceof Approved;
    }

    public function isReturned(): bool
    {
        return $this->state instanceof Returned;
    }

    public function isResubmitted(): bool
    {
        return $this->state instanceof Resubmitted;
    }

    public function isVehicleAuthorized(): bool
    {
        return $this->state instanceof VehicleAuthorized;
    }

    public function isSubmittable(): bool
    {
        return $this->isDraft();
    }

    public function isEndorsable(): bool
    {
        return $this->isSubmitted();
    }

    public function isReviewable(): bool
    {
        return $this->isEndorsed();
    }

    public function isApprovable(): bool
    {
        return $this->isReviewed();
    }

    public function isAuthorizable(): bool
    {
        return $this->isReviewed();
    }

    public function isReturnable(): bool
    {
        return $this->isSubmitted()
            || $this->isEndorsed()
            || $this->isReviewed()
            || $this->isApproved()
            || $this->isVehicleAuthorized();
    }

    public function isResubmittable(): bool
    {
        return $this->isReturned();
    }

    public function isDisapprovable(): bool
    {
        return $this->isSubmitted()
            || $this->isEndorsed()
            || $this->isReviewed()
            || $this->isApproved();
    }

    public function canTakeAction(string $action): bool
    {
        return match (strtolower(trim($action))) {
            'submit' => $this->isSubmittable(),
            'endorse' => $this->isEndorsable(),
            'review' => $this->isReviewable(),
            'approve' => $this->isApprovable(),
            'authorize' => $this->isAuthorizable(),
            'return' => $this->isReturnable(),
            'resubmit' => $this->isResubmittable(),
            'disapprove' => $this->isDisapprovable(),
            default => false,
        };
    }
}
