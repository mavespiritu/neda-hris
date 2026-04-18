<?php

namespace App\Traits;

use App\Models\TravelRequest;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

trait AuthorizesTravelRequests
{
    protected function canUsePermission(Authenticatable $user, string $permission): bool
    {
        return method_exists($user, 'can') && $user->can($permission);
    }

    protected function travelRequest(int|string $travelRequestId): ?TravelRequest
    {
        return TravelRequest::query()->find($travelRequestId);
    }

    protected function canCreateTravelRequest(Authenticatable $user): bool
    {
        return $this->canUsePermission($user, 'HRIS_travels.travel-requests.create');
    }

    protected function canViewAnyTravelRequests(Authenticatable $user): bool
    {
        return $this->canUsePermission($user, 'HRIS_travels.travel-requests.view.some')
            || $this->canUsePermission($user, 'HRIS_travels.travel-requests.view.any');
    }

    protected function canSeeAllTravelRequests(Authenticatable $user): bool
    {
        return $this->canUsePermission($user, 'HRIS_travels.travel-requests.view.any');
    }

    protected function canViewTravelRequest(Authenticatable $user, int|string $travelRequestId): bool
    {
        if ($this->canSeeAllTravelRequests($user)) {
            return true;
        }

        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.view.some')) {
            return false;
        }

        $travelRequest = $this->travelRequest($travelRequestId);

        if (! $travelRequest || blank($travelRequest->division) || blank($user->division)) {
            return false;
        }

        return (string) $travelRequest->division === (string) $user->division;
    }

    protected function canEditTravelRequest(Authenticatable $user, int|string $travelRequestId): bool
    {
        $travelRequest = $this->travelRequest($travelRequestId);

        return $travelRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.travel-requests.update')
            && $travelRequest->isEditable()
            && (string) $travelRequest->created_by === (string) ($user->ipms_id ?? '');
    }

    protected function canDeleteTravelRequest(Authenticatable $user, int|string $travelRequestId): bool
    {
        $travelRequest = $this->travelRequest($travelRequestId);

        return $travelRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.travel-requests.delete')
            && $travelRequest->isDeletable()
            && (string) $travelRequest->created_by === (string) ($user->ipms_id ?? '');
    }

    protected function canSubmitTravelRequest(Authenticatable $user, int|string $travelRequestId): bool
    {
        $travelRequest = $this->travelRequest($travelRequestId);

        return $travelRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.travel-requests.submit')
            && $travelRequest->isSubmittable()
            && (string) $travelRequest->created_by === (string) ($user->ipms_id ?? '');
    }

    protected function canReturnTravelRequest(Authenticatable $user, int|string $travelRequestId): bool
    {
        $travelRequest = $this->travelRequest($travelRequestId);
        $userEmployeeId = (string) ($user->ipms_id ?? '');

        return $travelRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.travel-requests.return')
            && $travelRequest->isReturnable()
            && (string) $travelRequest->created_by !== $userEmployeeId;
    }

    protected function canResubmitTravelRequest(Authenticatable $user, int|string $travelRequestId): bool
    {
        $travelRequest = $this->travelRequest($travelRequestId);

        return $travelRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.travel-requests.update')
            && $travelRequest->isResubmittable()
            && (string) $travelRequest->created_by === (string) ($user->ipms_id ?? '');
    }
    protected function travelRequestHasPassenger(TravelRequest $travelRequest, Authenticatable $user): bool
    {
        $userEmployeeId = (string) ($user->ipms_id ?? '');

        if ($userEmployeeId === '') {
            return false;
        }

        return DB::connection('mysql2')->table('travel_order_staffs')
            ->where('travel_order_id', $travelRequest->id)
            ->where('emp_id', $userEmployeeId)
            ->exists();
    }

    protected function canGenerateTravelRequest(Authenticatable $user, int|string $travelRequestId): bool
    {
        $travelRequest = $this->travelRequest($travelRequestId);

        return $travelRequest !== null
            && $travelRequest->isGeneratable()
            && (
                (string) $travelRequest->created_by === (string) ($user->ipms_id ?? '')
                || $this->travelRequestHasPassenger($travelRequest, $user)
            );
    }
}


