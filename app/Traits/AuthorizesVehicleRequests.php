<?php

namespace App\Traits;

use App\Models\VehicleRequest;
use Illuminate\Contracts\Auth\Authenticatable;

trait AuthorizesVehicleRequests
{
    protected function canUsePermission(Authenticatable $user, string $permission): bool
    {
        return method_exists($user, 'can') && $user->can($permission);
    }

    protected function vehicleRequest(int|string $vehicleRequestId): ?VehicleRequest
    {
        return VehicleRequest::query()->find($vehicleRequestId);
    }

    protected function canSubmitVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): bool
    {
        $vehicleRequest = $this->vehicleRequest($vehicleRequestId);

        return $vehicleRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.vehicle-requests.submit')
            && $vehicleRequest->isSubmittable();
    }

    protected function canEndorseVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): bool
    {
        $vehicleRequest = $this->vehicleRequest($vehicleRequestId);

        return $vehicleRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.vehicle-requests.endorse')
            && $vehicleRequest->isEndorsable();
    }

    protected function canReviewVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): bool
    {
        $vehicleRequest = $this->vehicleRequest($vehicleRequestId);

        return $vehicleRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.vehicle-requests.review')
            && $vehicleRequest->isReviewable();
    }

    protected function canApproveVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): bool
    {
        $vehicleRequest = $this->vehicleRequest($vehicleRequestId);

        return $vehicleRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.vehicle-requests.approve')
            && $vehicleRequest->isApprovable();
    }

    protected function canAuthorizeVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): bool
    {
        $vehicleRequest = $this->vehicleRequest($vehicleRequestId);

        return $vehicleRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.vehicle-requests.authorize')
            && $vehicleRequest->isAuthorizable();
    }

    protected function canReturnVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): bool
    {
        $vehicleRequest = $this->vehicleRequest($vehicleRequestId);

        return $vehicleRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.vehicle-requests.return')
            && $vehicleRequest->isReturnable();
    }

    protected function canResubmitVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): bool
    {
        $vehicleRequest = $this->vehicleRequest($vehicleRequestId);

        return $vehicleRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.vehicle-requests.resubmit')
            && $vehicleRequest->isResubmittable();
    }

    protected function canDisapproveVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): bool
    {
        $vehicleRequest = $this->vehicleRequest($vehicleRequestId);

        return $vehicleRequest !== null
            && $this->canUsePermission($user, 'HRIS_travels.vehicle-requests.disapprove')
            && $vehicleRequest->isDisapprovable();
    }
}
