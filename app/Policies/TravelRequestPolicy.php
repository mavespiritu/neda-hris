<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Auth\Access\Response;

class TravelRequestPolicy
{
    /**
     * Create a new policy instance.
     */
    public function __construct()
    {
        //
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

    public function create(User $user): Response
    {
        return $user->hasRole('HRIS_Staff')
            ? Response::allow()
            : Response::deny('Only DRO1 staff can create travel requests.');
    }

    public function viewAny(User $user): Response
    {
        return $user->hasRole('HRIS_Staff')
            ? Response::allow()
            : Response::deny('Only DRO1 staff can view travel requests.');
    }

    public function edit(User $user, $travelRequestId): Response
    {
        $conn2 = DB::connection('mysql2');

        $travelRequest = $conn2->table('travel_order')
            ->where('id', $travelRequestId)
            ->first();

        if (!$travelRequest) {
            return Response::deny('Travel request not found.');
        }

        $latestStatus = $conn2->table('submission_history')
            ->where('model', 'TO')
            ->where('model_id', $travelRequestId)
            ->orderByDesc('date_acted')
            ->value('status');

        if ($user->hasRole('HRIS_PRU')) {
            return Response::allow();
        }

        $status = trim((string) ($latestStatus ?? 'Draft'));

        if (!in_array($status, ['Draft', 'Returned'], true)) {
            return Response::deny('Only draft requests can be edited.');
        }

        if ((string) $travelRequest->created_by !== (string) $user->ipms_id) {
            return Response::deny('Only the request creator can edit.');
        }

        return Response::allow();
    }

    public function delete(User $user, $travelRequestId): Response
    {
        $conn2 = DB::connection('mysql2');

        $travelRequest = $conn2->table('travel_order')
            ->where('id', $travelRequestId)
            ->first();

        if (!$travelRequest) {
            return Response::deny('Travel request not found.');
        }

        $latestStatus = $conn2->table('submission_history')
            ->where('model', 'TO')
            ->where('model_id', $travelRequestId)
            ->orderByDesc('date_acted')
            ->value('status');

        if ($user->hasRole('HRIS_PRU')) {
            return Response::allow();
        }

        $status = trim((string) ($latestStatus ?? 'Draft'));

        if (!in_array($status, ['Draft', 'Returned'], true)) {
            return Response::deny('Only draft requests can be deleted.');
        }

        if ((string) $travelRequest->created_by !== (string) $user->ipms_id) {
            return Response::deny('Only the request creator can delete.');
        }

        return Response::allow();
    }

    public function view(User $user, $travelRequestId): Response
    {
        $conn2 = DB::connection('mysql2');

        $travelRequest = $conn2->table('travel_order')
            ->select(['id', 'division', 'created_by'])
            ->where('id', $travelRequestId)
            ->first();

        if (!$travelRequest) {
            return Response::deny('Travel request not found.');
        }

        $userRoles = $user->roles->pluck('name')->toArray();

        $globalRoles = ['HRIS_RD', 'HRIS_ARD', 'HRIS_PRU', 'HRIS_Administrator'];

        if (count(array_intersect($userRoles, $globalRoles)) > 0) {
            return Response::allow();
        }

        $divisionRoles = ['HRIS_DC', 'HRIS_Staff'];

        if (
            count(array_intersect($userRoles, $divisionRoles)) > 0 &&
            !empty($travelRequest->division) &&
            (string) $user->division === (string) $travelRequest->division
        ) {
            return Response::allow();
        }

        $empId = (string) $user->ipms_id;

        // 3) Creator
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

    public function submit(User $user, $travelRequestId): Response
    {
        $conn2 = DB::connection('mysql2');

        $travelRequest = $conn2->table('travel_order')
            ->where('id', $travelRequestId)
            ->first();

        if (!$travelRequest) {
            return Response::deny('Travel request not found.');
        }

        $latestStatus = $conn2->table('submission_history')
            ->where('model', 'TO')
            ->where('model_id', $travelRequestId)
            ->orderByDesc('date_acted')
            ->value('status'); 

        $status = trim((string) ($latestStatus ?? 'Draft'));

        if (!in_array($status, ['Draft', 'Returned'], true)) {
            return Response::deny('Only draft or returned requests can be submitted.');
        }

        if (empty($travelRequest->division)) {
            return Response::deny('Division not set for this request.');
        }

        if ((string) $travelRequest->created_by !== (string) $user->ipms_id) {
            return Response::deny('Only the request creator can submit.');
        }

        return Response::allow();
    }
}
