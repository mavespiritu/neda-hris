<?php

namespace App\Actions\TravelRequests;

use App\Events\TravelRequestStateChanged;
use App\Models\User;
use App\Notifications\TravelRequests\TravelRequestNotification;
use App\Services\TravelRequests\TravelRequestMailPayloadBuilder;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class DispatchTravelRequestNotification implements ShouldQueue
{
    use AsAction;

    public bool $afterCommit = true;

    public function handle(
        int $travelRequestId,
        string $action,
        string $fromState,
        string $toState,
        string $actedBy,
        ?string $remarks = null,
        ?string $returnToState = null,
        ?string $returnToUser = null,
    ): void {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $order = $conn2->table('travel_order')->where('id', $travelRequestId)->first();
        if (! $order) {
            Log::warning('TR notification: travel request not found', ['id' => $travelRequestId]);
            return;
        }

        $creatorEmpId = (string) ($order->created_by ?? '');
        $divisionFallback = $order->division ?? null;

        $employee = $creatorEmpId !== ''
            ? $conn3->table('tblemployee')->select(['division_id'])->where('emp_id', $creatorEmpId)->first()
            : null;

        $divisionId = $employee?->division_id ?? $divisionFallback;

        $targets = collect($this->resolveRecipientTargets(
            conn2: $conn2,
            action: $action,
            travelRequestId: $travelRequestId,
            divisionId: $divisionId,
            returnToUser: $returnToUser
        ))
            ->filter(fn ($t) => !empty($t['emp_id']) && !empty($t['required_action']))
            ->map(fn ($t) => [
                'emp_id' => (string) $t['emp_id'],
                'required_action' => (string) $t['required_action'],
            ])
            ->unique(fn ($t) => $t['emp_id'].'|'.$t['required_action'])
            ->values();

        if ($targets->isEmpty()) {
            return;
        }

        $usersByEmpId = User::query()
            ->whereIn('ipms_id', $targets->pluck('emp_id')->all())
            ->get()
            ->keyBy(fn ($u) => (string) $u->ipms_id);

        if ($usersByEmpId->isEmpty()) {
            Log::info('TR notification: no Users mapped for recipients', [
                'tr_id' => $travelRequestId,
                'recipients_emp_id' => $targets->pluck('emp_id')->all(),
            ]);
            return;
        }

        $builder = app(TravelRequestMailPayloadBuilder::class);

        foreach ($targets as $target) {
            $user = $usersByEmpId->get($target['emp_id']);
            if (! $user) {
                continue;
            }

            $payload = $builder->build(
                travelRequestId: $travelRequestId,
                action: $action,
                requiredAction: $target['required_action'],
                notifiable: $user,
                meta: [
                    'remarks' => $remarks,
                    'from_state' => $fromState,
                    'to_state' => $toState,
                    'acted_by' => $actedBy,
                    'return_to_state' => $returnToState,
                    'return_to_user' => $returnToUser,
                ]
            );

            $user->notify(new TravelRequestNotification($payload));
        }
    }

    public function asListener(TravelRequestStateChanged $event): void
    {
        $this->handle(
            $event->travelRequestId,
            $event->action,
            $event->fromState,
            $event->toState,
            $event->actedBy,
            $event->remarks,
            $event->returnToState,
            $event->returnToUser
        );
    }

    public function getJobQueue(): string
    {
        return 'notifications';
    }

    private function resolveRecipientTargets($conn2, string $action, int $travelRequestId, $divisionId, ?string $returnToUser): array
    {
        $creator = $this->creatorEmpIdFromTravelRequest($conn2, $travelRequestId);

        return match ($action) {
            'returned' => $returnToUser ? [[
                'emp_id' => $returnToUser,
                'required_action' => 'resubmit',
            ]] : [],

            default => [],
        };
    }

    private function signatoryTargets($conn2, string $type, $divisionId, string $requiredAction): array
    {
        return $conn2->table('travel_order_signatories')
            ->where('type', $type)
            ->when($divisionId, fn ($q) => $q->where('division', $divisionId))
            ->pluck('signatory')
            ->filter()
            ->map(fn ($empId) => [
                'emp_id' => (string) $empId,
                'required_action' => $requiredAction,
            ])
            ->values()
            ->all();
    }

    private function creatorEmpIdFromTravelRequest($conn2, int $travelRequestId): ?string
    {
        $row = $conn2->table('travel_order')
            ->select(['created_by'])
            ->where('id', $travelRequestId)
            ->first();

        $creator = (string) ($row->created_by ?? '');
        return $creator !== '' ? $creator : null;
    }
}
