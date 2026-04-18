<?php

namespace App\Policies;

use App\Models\TravelRequest;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class TravelRequestPolicy
{
    public function __construct()
    {
        //
    }

    protected function isStaffUser(Authenticatable $user): bool
    {
        return method_exists($user, 'hasRole')
            && ! blank($user->ipms_id ?? null);
    }

    protected function canUsePermission(Authenticatable $user, string $permission): bool
    {
        return method_exists($user, 'can') && $user->can($permission);
    }

    public function visibleEmployeeIds(Authenticatable $user)
    {
        $conn3 = DB::connection('mysql3');
        $q = $conn3->table('tblemployee')
            ->select('emp_id')
            ->where('work_status', 'active');

        if (! $this->isStaffUser($user)) {
            return $q->whereRaw('1=0');
        }

        $rolePriorities = config('roles.priorities', []);
        $userRoles = $user->roles->pluck('name')->toArray();

        $highestRole = collect($userRoles)
            ->mapWithKeys(fn ($role) => [$role => $rolePriorities[$role] ?? 0])
            ->sortDesc()
            ->keys()
            ->first();

        return match ($highestRole) {
            'HRIS_RD', 'HRIS_ARD', 'HRIS_PRU' => $q,
            'HRIS_ADC', 'HRIS_DC'            => $q->where('division_id', $user->division),
            'HRIS_Staff'                     => $q->where('emp_id', $user->ipms_id),
            default                          => $q->whereRaw('1=0'),
        };
    }

    private function hasSignatoryAssignment(Authenticatable $user, string $type): bool
    {
        if (! $this->isStaffUser($user)) {
            return false;
        }

        return DB::connection('mysql2')
            ->table('travel_order_signatories')
            ->where('type', $type)
            ->where('signatory', (string) $user->ipms_id)
            ->exists();
    }

    private function isReviewer(Authenticatable $user): bool
    {
        return $this->hasSignatoryAssignment($user, 'Reviewer_VR');
    }

    private function isApprover(Authenticatable $user): bool
    {
        return $this->hasSignatoryAssignment($user, 'Approver_VR');
    }

    private function canSeeAllTravelRequests(Authenticatable $user): bool
    {
        return $this->isReviewer($user)
            || $this->isApprover($user)
            || $this->canUsePermission($user, 'HRIS_travels.travel-requests.view.any')
            || $user->hasRole(['HRIS_RD', 'HRIS_ARD', 'HRIS_PRU', 'HRIS_Administrator']);
    }

    private function latestStatus(int|string $travelRequestId): string
    {
        $tr = TravelRequest::query()->find($travelRequestId);

        if ($tr?->state) {
            return (string) $tr->state->label();
        }

        return (string) (
            DB::connection('mysql2')->table('submission_history')
                ->where('model', 'TO')
                ->where('model_id', $travelRequestId)
                ->orderByDesc('id')
                ->value('status') ?? 'Draft'
        );
    }

    private function requestRow(int|string $travelRequestId): ?object
    {
        return DB::connection('mysql2')->table('travel_order')
            ->select(['id', 'division', 'created_by', 'tr_state', 'tr_return_to_user'])
            ->where('id', $travelRequestId)
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

    public function submit(Authenticatable $user, $travelRequestId): Response
    {
        if (! $this->isStaffUser($user)) {
            return Response::deny('Only DRO1 staff can submit travel requests.');
        }

        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.submit')) {
            return Response::deny('You are not allowed to submit travel requests.');
        }

        $tr = $this->requestRow($travelRequestId);
        if (! $tr) {
            return Response::deny('Travel request not found.');
        }

        if ((string) $tr->created_by !== (string) $user->ipms_id) {
            return Response::deny('Only the creator can submit this request.');
        }

        if ($this->latestStatus($travelRequestId) !== 'Draft') {
            return Response::deny('Only draft requests can be submitted.');
        }

        return Response::allow();
    }

    public function create(Authenticatable $user): Response
    {
        if (! $this->isStaffUser($user)) {
            return Response::deny('Only DRO1 staff can create travel requests.');
        }

        return $this->canUsePermission($user, 'HRIS_travels.travel-requests.create')
            ? Response::allow()
            : Response::deny('You are not allowed to create travel requests.');
    }

    public function viewAny(Authenticatable $user): Response
    {
        if (! $this->isStaffUser($user)) {
            return Response::deny('Only DRO1 staff can view travel requests.');
        }

        return ($this->canUsePermission($user, 'HRIS_travels.travel-requests.view.some')
            || $this->canUsePermission($user, 'HRIS_travels.travel-requests.view.any'))
            ? Response::allow()
            : Response::deny('You are not allowed to view travel requests.');
    }

    public function edit(Authenticatable $user, $travelRequestId): Response
    {
        if (! $this->isStaffUser($user)) {
            return Response::deny('Only DRO1 staff can edit travel requests.');
        }

        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.update')) {
            return Response::deny('You are not allowed to update travel requests.');
        }

        $travelRequest = $this->requestRow($travelRequestId);
        if (! $travelRequest) {
            return Response::deny('Travel request not found.');
        }

        $status = $this->latestStatus($travelRequestId);
        if (! in_array($status, ['Draft', 'Returned'], true)) {
            return Response::deny('Only draft or returned requests can be edited.');
        }

        if ((string) $travelRequest->created_by !== (string) $user->ipms_id) {
            return Response::deny('Only the request creator can edit.');
        }

        return Response::allow();
    }

    public function delete(Authenticatable $user, $travelRequestId): Response
    {
        if (! $this->isStaffUser($user)) {
            return Response::deny('Only DRO1 staff can delete travel requests.');
        }

        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.delete')) {
            return Response::deny('You are not allowed to delete travel requests.');
        }

        $travelRequest = $this->requestRow($travelRequestId);
        if (! $travelRequest) {
            return Response::deny('Travel request not found.');
        }

        $status = $this->latestStatus($travelRequestId);
        if (! in_array($status, ['Draft', 'Returned'], true)) {
            return Response::deny('Only draft or returned requests can be deleted.');
        }

        if ((string) $travelRequest->created_by !== (string) $user->ipms_id) {
            return Response::deny('Only the request creator can delete.');
        }

        return Response::allow();
    }

    public function view(Authenticatable $user, $travelRequestId): Response
    {
        if (! $this->isStaffUser($user)) {
            return Response::deny('You are not authorized to view this travel request.');
        }

        $conn2 = DB::connection('mysql2');
        $travelRequest = $conn2->table('travel_order')
            ->select(['id', 'division', 'created_by'])
            ->where('id', $travelRequestId)
            ->first();

        if (! $travelRequest) {
            return Response::deny('Travel request not found.');
        }

        if ($this->canUsePermission($user, 'HRIS_travels.travel-requests.view.any')) {
            return Response::allow();
        }

        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.view.some')) {
            return Response::deny('You are not authorized to view this travel request.');
        }

        $userRoles = $user->roles->pluck('name')->toArray();
        $divisionRoles = ['HRIS_DC', 'HRIS_Staff'];

        if (
            count(array_intersect($userRoles, $divisionRoles)) > 0 &&
            ! empty($travelRequest->division) &&
            (string) $user->division === (string) $travelRequest->division
        ) {
            return Response::allow();
        }

        $empId = (string) $user->ipms_id;
        if ((string) $travelRequest->created_by === $empId) {
            return Response::allow();
        }

        $isAuthorizedStaff = $conn2->table('travel_order_staffs')
            ->where('travel_order_id', $travelRequestId)
            ->where(function ($q) use ($empId) {
                $q->where('emp_id', $empId)
                    ->orWhere('recommender_id', $empId)
                    ->orWhere('approver_id', $empId);
            })
            ->exists();

        if ($isAuthorizedStaff) {
            return Response::allow();
        }

        return Response::deny('You are not authorized to view this travel request.');
    }

    public function filterAny(Authenticatable $user): Response
    {
        if (! $this->canSeeAllTravelRequests($user)) {
            return Response::deny('Not allowed to filter any travel requests.');
        }

        return Response::allow();
    }

    public function return(Authenticatable $user, $travelRequestId): Response
    {
        if (! $this->isStaffUser($user)) {
            return Response::deny('Only DRO1 staff can return travel requests.');
        }

        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.return')) {
            return Response::deny('You are not allowed to return travel requests.');
        }

        $tr = $this->requestRow($travelRequestId);
        if (! $tr) {
            return Response::deny('Travel request not found.');
        }

        $status = $this->latestStatus($travelRequestId);
        if (in_array($status, ['Draft', 'Returned'], true)) {
            return Response::deny("{$status} requests cannot be returned.");
        }

        $reviewerIds = $this->signatoryIds('Reviewer_VR');
        if ($reviewerIds->contains((string) $user->ipms_id)) {
            return Response::allow();
        }

        $typeByStatus = [
            'Submitted' => 'Reviewer_VR',
        ];

        $requiredType = $typeByStatus[$status] ?? null;
        if (! $requiredType) {
            return Response::deny('This request cannot be returned at its current status.');
        }

        if (! in_array($requiredType, ['Reviewer_VR'], true) && empty($tr->division)) {
            return Response::deny('Division not set for this request.');
        }

        $ids = $this->signatoryIds($requiredType, (string) $tr->division);
        if ($ids->isEmpty()) {
            return Response::deny("No signatory found for {$requiredType}.");
        }

        if (! $ids->contains((string) $user->ipms_id)) {
            return Response::deny('Not allowed to return.');
        }

        return Response::allow();
    }

    public function resubmit(Authenticatable $user, $travelRequestId): Response
    {
        if (! $this->isStaffUser($user)) {
            return Response::deny('Only DRO1 staff can resubmit travel requests.');
        }

        if (! $this->canUsePermission($user, 'HRIS_travels.travel-requests.update')) {
            return Response::deny('You are not allowed to resubmit travel requests.');
        }

        $tr = $this->requestRow($travelRequestId);
        if (! $tr) {
            return Response::deny('Travel request not found.');
        }

        if ($this->latestStatus($travelRequestId) !== 'Returned') {
            return Response::deny('Only returned requests can be resubmitted.');
        }

        if ((string) $tr->created_by !== (string) $user->ipms_id) {
            return Response::deny('Only the creator can resubmit.');
        }

        return Response::allow();
    }

    public function generate(Authenticatable $user, $travelRequestId): Response
    {
        if (! $this->isStaffUser($user)) {
            return Response::deny('You are not authorized to view this travel request.');
        }

        $conn2 = DB::connection('mysql2');

        if ($user->hasRole('HRIS_PRU')) {
            return Response::allow();
        }

        $travelRequest = $conn2->table('travel_order')
            ->select(['id', 'division', 'created_by'])
            ->where('id', $travelRequestId)
            ->first();

        if (! $travelRequest) {
            return Response::deny('Travel request not found.');
        }

        $status = $this->latestStatus($travelRequestId);
        if ($status !== 'Submitted') {
            return Response::deny('Only submitted travel requests can be generated.');
        }

        if ($this->canSeeAllTravelRequests($user)) {
            return Response::allow();
        }

        $userRoles = $user->roles->pluck('name')->toArray();
        $divisionRoles = ['HRIS_DC', 'HRIS_Staff'];
        if (
            count(array_intersect($userRoles, $divisionRoles)) > 0 &&
            ! empty($travelRequest->division) &&
            (string) $user->division === (string) $travelRequest->division
        ) {
            return Response::allow();
        }

        $empId = (string) $user->ipms_id;
        if ((string) $travelRequest->created_by === $empId) {
            return Response::allow();
        }

        $isAuthorizedStaff = $conn2->table('travel_order_staffs')
            ->where('travel_order_id', $travelRequestId)
            ->where(function ($q) use ($empId) {
                $q->where('emp_id', $empId)
                    ->orWhere('recommender_id', $empId)
                    ->orWhere('approver_id', $empId);
            })
            ->exists();

        if ($isAuthorizedStaff) {
            return Response::allow();
        }

        return Response::deny('You are not authorized to view this travel request.');
    }
}