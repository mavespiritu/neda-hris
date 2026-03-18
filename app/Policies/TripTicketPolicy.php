<?php

namespace App\Policies;

use App\Models\VehicleRequest;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class TripTicketPolicy
{
    private function isStaffUser(Authenticatable $user): bool
    {
        return method_exists($user, 'hasRole')
            && ! blank($user->ipms_id ?? null);
    }

    private function isReviewer(Authenticatable $user): bool
    {
        if (! $this->isStaffUser($user)) {
            return false;
        }

        return DB::connection('mysql2')
            ->table('travel_order_signatories')
            ->where('type', 'Reviewer_VR')
            ->where('signatory', (string) $user->ipms_id)
            ->exists();
    }

    private function latestVehicleRequestStatus(int|string $vehicleRequestId): string
    {
        $vr = VehicleRequest::query()->find($vehicleRequestId);

        if ($vr?->state) {
            return (string) $vr->state->label();
        }

        return (string) (
            DB::connection('mysql2')->table('submission_history')
                ->where('model', 'Vehicle Request')
                ->where('model_id', $vehicleRequestId)
                ->orderByDesc('id')
                ->value('status') ?? 'Draft'
        );
    }

    private function isAuthorized(string $status): bool
    {
        return in_array($status, ['Approved'], true);
    }

    private function vehicleRequestRow(int|string $vehicleRequestId): ?object
    {
        return DB::connection('mysql2')->table('travel_order')
            ->select(['id', 'created_by'])
            ->where('id', $vehicleRequestId)
            ->first();
    }

    public function viewAny(Authenticatable $user): Response
    {
        return $this->isReviewer($user)
            ? Response::allow()
            : Response::deny('Not allowed to view trip tickets.');
    }

    public function view(Authenticatable $user): Response
    {
        return $this->isReviewer($user)
            ? Response::allow()
            : Response::deny('Not allowed to view this trip ticket.');
    }

    public function create(Authenticatable $user): Response
    {
        return $this->isReviewer($user)
            ? Response::allow()
            : Response::deny('Not allowed to create trip tickets.');
    }

    public function edit(Authenticatable $user): Response
    {
        return $this->isReviewer($user)
            ? Response::allow()
            : Response::deny('Not allowed to edit trip tickets.');
    }

    public function delete(Authenticatable $user): Response
    {
        return $this->isReviewer($user)
            ? Response::allow()
            : Response::deny('Not allowed to delete trip tickets.');
    }

    public function viewByVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): Response
    {
        $vr = $this->vehicleRequestRow($vehicleRequestId);
        if (! $vr) return Response::deny('Vehicle request not found.');

        $status = $this->latestVehicleRequestStatus($vehicleRequestId);
        if (! $this->isAuthorized($status)) {
            return Response::deny('Trip ticket is only available when vehicle request is authorized.');
        }

        if ((string) $vr->created_by === (string) $user->ipms_id) {
            return Response::allow();
        }

        if ($this->isReviewer($user)) {
            return Response::allow();
        }

        return Response::deny('Not allowed to view trip ticket for this vehicle request.');
    }

    public function createByVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): Response
    {
        if (! $this->isReviewer($user)) {
            return Response::deny('Only reviewer can create trip ticket for vehicle request.');
        }

        $status = $this->latestVehicleRequestStatus($vehicleRequestId);
        if (! $this->isAuthorized($status)) {
            return Response::deny('Vehicle request must be authorized before creating trip ticket.');
        }

        return Response::allow();
    }

    public function editByVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): Response
    {
        if (! $this->isReviewer($user)) {
            return Response::deny('Only reviewer can edit trip ticket for vehicle request.');
        }

        $status = $this->latestVehicleRequestStatus($vehicleRequestId);
        if (! $this->isAuthorized($status)) {
            return Response::deny('Vehicle request must be authorized before editing trip ticket.');
        }

        return Response::allow();
    }

    public function deleteByVehicleRequest(Authenticatable $user, int|string $vehicleRequestId): Response
    {
        if (! $this->isReviewer($user)) {
            return Response::deny('Only reviewer can delete trip ticket for vehicle request.');
        }

        $status = $this->latestVehicleRequestStatus($vehicleRequestId);
        if (! $this->isAuthorized($status)) {
            return Response::deny('Vehicle request must be authorized before deleting trip ticket.');
        }

        return Response::allow();
    }

    public function generate(Authenticatable $user): Response
    {
        if (! $this->isReviewer($user)) {
            return Response::deny('Not allowed to generate trip tickets.');
        }

        return Response::allow();
    }

    public function completeTrip(Authenticatable $user): Response
    {
        return $this->isReviewer($user)
            ? Response::allow()
            : Response::deny('Not allowed to complete trips.');
    }
}
