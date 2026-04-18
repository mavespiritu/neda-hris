<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VehicleRequest;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\DB;

class VehicleRequestPolicy
{
    public function __construct()
    {
        //
    }

    protected function canUsePermission(User $user, string $permission): bool
    {
        return method_exists($user, 'can') && $user->can($permission);
    }

    public function visibleEmployeeIds(User $user)
    {
        $conn3 = DB::connection('mysql3');

        $rolePriorities = config('roles.priorities', []);
        $userRoles = $user->roles->pluck('name')->toArray();

        $highestRole = collect($userRoles)
            ->mapWithKeys(fn ($role) => [$role => $rolePriorities[$role] ?? 0])
            ->sortDesc()
            ->keys()
            ->first();

        $q = $conn3->table('tblemployee')
            ->select('emp_id')
            ->where('work_status', 'active');

        return match ($highestRole) {
            'HRIS_RD', 'HRIS_ARD', 'HRIS_PRU' => $q,
            'HRIS_ADC', 'HRIS_DC'            => $q->where('division_id', $user->division),
            'HRIS_Staff'                     => $q->where('emp_id', $user->ipms_id),
            default                          => $q->whereRaw('1=0'),
        };
    }

    private function latestStatus(int|string $vehicleRequestId): string
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

    private function requestRow(int|string $vehicleRequestId): ?object
    {
        return DB::connection('mysql2')->table('travel_order')
            ->select(['id', 'division', 'created_by', 'vr_state', 'vr_return_to_user'])
            ->where('id', $vehicleRequestId)
            ->first();
    }

    private function signatoryIds(string $type, ?string $division = null)
    {
        $q = DB::connection('mysql2')
            ->table('travel_order_signatories')
            ->where('type', $type);

        $globalTypes = ['Approver_TT', 'Reviewer_VR'];

        if (! in_array($type, $globalTypes, true) && $division) {
            $q->where('division', $division);
        }

        return $q->pluck('signatory')
            ->filter()
            ->map(fn ($v) => (string) $v)
            ->unique()
            ->values();
    }

    public function submit(User $user, $vehicleRequestId): Response
    {
        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.vehicle-request.submit')) {
            return Response::deny('You are not allowed to submit vehicle requests.');
        }

        $vr = $this->requestRow($vehicleRequestId);
        if (! $vr) {
            return Response::deny('Vehicle request not found.');
        }

        if ((string) $vr->created_by !== (string) $user->ipms_id) {
            return Response::deny('Only the creator can submit this request.');
        }

        if ($this->latestStatus($vehicleRequestId) !== 'Draft') {
            return Response::deny('Only draft requests can be submitted.');
        }

        return Response::allow();
    }

    public function endorse(User $user, $vehicleRequestId): Response
    {
        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.vehicle-request.endorse')) {
            return Response::deny('You are not allowed to endorse vehicle requests.');
        }

        $vr = $this->requestRow($vehicleRequestId);
        if (! $vr) {
            return Response::deny('Vehicle request not found.');
        }

        if ($this->latestStatus($vehicleRequestId) !== 'Submitted') {
            return Response::deny('Only submitted requests can be endorsed.');
        }

        $ids = $this->signatoryIds('Recommending_VR', (string) $vr->division);
        if ($ids->isEmpty()) return Response::deny('Endorser not found.');
        if (! $ids->contains((string) $user->ipms_id)) return Response::deny('Not allowed to endorse.');

        return Response::allow();
    }

    public function review(User $user, $vehicleRequestId): Response
    {
        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.vehicle-request.review')) {
            return Response::deny('You are not allowed to review vehicle requests.');
        }

        $vr = $this->requestRow($vehicleRequestId);
        if (! $vr) return Response::deny('Vehicle request not found.');
        if ($this->latestStatus($vehicleRequestId) !== 'Endorsed') return Response::deny('Only endorsed requests can be reviewed.');

        $ids = $this->signatoryIds('Reviewer_VR', (string) $vr->division);
        if ($ids->isEmpty()) return Response::deny('Reviewer not found.');
        if (! $ids->contains((string) $user->ipms_id)) return Response::deny('Not allowed to review.');

        return Response::allow();
    }

    public function approve(User $user, $vehicleRequestId): Response
    {
        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.vehicle-request.approve')) {
            return Response::deny('You are not allowed to approve vehicle requests.');
        }

        $vr = $this->requestRow($vehicleRequestId);
        if (! $vr) return Response::deny('Vehicle request not found.');
        if ($this->latestStatus($vehicleRequestId) !== 'Reviewed') return Response::deny('Only reviewed requests can be approved.');

        $ids = $this->signatoryIds('Approver_VR', (string) $vr->division);
        if ($ids->isEmpty()) return Response::deny('Approver not found.');
        if (! $ids->contains((string) $user->ipms_id)) return Response::deny('Not allowed to approve.');

        return Response::allow();
    }

    public function disapprove(User $user, $vehicleRequestId): Response
    {
        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.vehicle-request.disapprove')) {
            return Response::deny('You are not allowed to disapprove vehicle requests.');
        }

        $vr = $this->requestRow($vehicleRequestId);
        if (! $vr) return Response::deny('Vehicle request not found.');

        $status = $this->latestStatus($vehicleRequestId);

        $typeByStatus = [
            'Submitted' => 'Recommending_VR',
            'Endorsed'  => 'Reviewer_VR',
            'Reviewed'  => 'Approver_VR',
            'Approved'  => null,
        ];

        $requiredType = $typeByStatus[$status] ?? null;
        if (! $requiredType) return Response::deny('This request cannot be disapproved at its current status.');

        $ids = $this->signatoryIds($requiredType, (string) $vr->division);
        if ($ids->isEmpty()) return Response::deny("No signatory found for {$requiredType}.");
        if (! $ids->contains((string) $user->ipms_id)) return Response::deny('Not allowed to disapprove.');

        return Response::allow();
    }

    public function return(User $user, $vehicleRequestId): Response
    {
        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.vehicle-request.return')) {
            return Response::deny('You are not allowed to return vehicle requests.');
        }

        $vr = $this->requestRow($vehicleRequestId);
        if (! $vr) return Response::deny('Vehicle request not found.');

        $status = $this->latestStatus($vehicleRequestId);

        if (in_array($status, ['Draft', 'Returned'], true)) {
            return Response::deny("{$status} requests cannot be returned.");
        }

        $reviewerIds = $this->signatoryIds('Reviewer_VR');
        if ($reviewerIds->contains((string) $user->ipms_id)) {
            return Response::allow();
        }

        $typeByStatus = [
            'Submitted' => 'Recommending_VR',
            'Endorsed'  => 'Reviewer_VR',
            'Reviewed'  => 'Approver_VR',
            'Approved'  => null,
        ];

        $requiredType = $typeByStatus[$status] ?? null;
        if (! $requiredType) return Response::deny('This request cannot be returned at its current status.');

        if (! in_array($requiredType, ['Approver_TT', 'Reviewer_VR'], true) && empty($vr->division)) {
            return Response::deny('Division not set for this request.');
        }

        $ids = $this->signatoryIds($requiredType, (string) $vr->division);
        if ($ids->isEmpty()) return Response::deny("No signatory found for {$requiredType}.");
        if (! $ids->contains((string) $user->ipms_id)) return Response::deny('Not allowed to return.');

        return Response::allow();
    }

    public function resubmit(User $user, $vehicleRequestId): Response
    {
        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.vehicle-request.submit')) {
            return Response::deny('You are not allowed to resubmit vehicle requests.');
        }

        $vr = $this->requestRow($vehicleRequestId);
        if (! $vr) return Response::deny('Vehicle request not found.');

        $status = $this->latestStatus($vehicleRequestId);
        if ($status !== 'Returned') return Response::deny('Only returned requests can be resubmitted.');

        if ((string) $vr->created_by !== (string) $user->ipms_id) {
            return Response::deny('Only the creator can resubmit.');
        }

        return Response::allow();
    }
}