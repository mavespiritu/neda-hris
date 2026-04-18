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
        ?int $resendOfLogId = null,
    ): void {
        $conn2 = DB::connection('mysql2');
        $conn3 = DB::connection('mysql3');

        $order = $conn2->table('travel_order')->where('id', $travelRequestId)->first();
        if (! $order) {
            Log::warning('TR notification: travel request not found', ['id' => $travelRequestId]);
            return;
        }

        $creatorEmpId = (string) ($order->created_by ?? '');
        $employee = $creatorEmpId !== ''
            ? $conn3->table('tblemployee')->select(['division_id'])->where('emp_id', $creatorEmpId)->first()
            : null;
        $divisionId = $employee?->division_id ?? ($order->division ?? null);

        $targets = collect($this->resolveRecipientTargets(
            conn2: $conn2,
            action: $action,
            travelRequestId: $travelRequestId,
            divisionId: $divisionId,
            returnToUser: $returnToUser
        ))
            ->filter(fn ($t) => ! empty($t['emp_id']) && ! empty($t['required_action']))
            ->map(fn ($t) => [
                'emp_id' => (string) $t['emp_id'],
                'required_action' => (string) $t['required_action'],
            ])
            ->unique(fn ($t) => $t['emp_id'].'|'.$t['required_action'])
            ->values();

        if ($targets->isEmpty()) {
            $this->recordNotificationLog(
                conn2: $conn2,
                travelRequestId: $travelRequestId,
                action: $action,
                status: 'missing',
                recipientEmpId: null,
                recipientEmail: null,
                payload: ['subject' => null],
                meta: [
                    'step' => $this->templateKey($action),
                    'from_state' => $fromState,
                    'to_state' => $toState,
                    'acted_by' => $actedBy,
                    'remarks' => $remarks,
                    'intended_actor' => null,
                    'recipients' => [],
                ],
                resendOfLogId: $resendOfLogId,
            );

            Log::info('TR notification: no recipient targets resolved', [
                'tr_id' => $travelRequestId,
                'action' => $action,
            ]);

            return;
        }

        $usersByEmpId = User::query()
            ->whereIn('ipms_id', $targets->pluck('emp_id')->all())
            ->get()
            ->keyBy(fn ($u) => (string) $u->ipms_id);

        if ($usersByEmpId->isEmpty()) {
            $this->recordNotificationLog(
                conn2: $conn2,
                travelRequestId: $travelRequestId,
                action: $action,
                status: 'missing',
                recipientEmpId: null,
                recipientEmail: null,
                payload: ['subject' => null],
                meta: [
                    'step' => $this->templateKey($action),
                    'from_state' => $fromState,
                    'to_state' => $toState,
                    'acted_by' => $actedBy,
                    'remarks' => $remarks,
                    'intended_actor' => null,
                    'recipients' => [],
                ],
                resendOfLogId: $resendOfLogId,
            );

            Log::info('TR notification: no Users mapped for recipients', [
                'tr_id' => $travelRequestId,
                'recipients_emp_id' => $targets->pluck('emp_id')->all(),
            ]);

            return;
        }

        $builder = app(TravelRequestMailPayloadBuilder::class);
        $templateKey = $this->templateKey($action);
        $intendedActor = $this->intendedActorLabel($action, $returnToUser, $divisionId);

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
                    'intended_actor' => $intendedActor,
                    'step' => $templateKey,
                ]
            );

            $logId = $this->recordNotificationLog(
                conn2: $conn2,
                travelRequestId: $travelRequestId,
                action: $action,
                status: 'queued',
                recipientEmpId: (string) $user->ipms_id,
                recipientEmail: (string) $user->email,
                payload: $payload,
                meta: [
                    'step' => $templateKey,
                    'from_state' => $fromState,
                    'to_state' => $toState,
                    'acted_by' => $actedBy,
                    'remarks' => $remarks,
                    'intended_actor' => $intendedActor,
                    'recipients' => [$user->email],
                ],
                resendOfLogId: $resendOfLogId,
            );

            try {
                $user->notify(new TravelRequestNotification($payload));

                $conn2->table('workflow_notification_logs')
                    ->where('id', $logId)
                    ->update([
                        'status' => 'sent',
                        'sent_at' => now(),
                        'updated_at' => now(),
                    ]);
            } catch (\Throwable $e) {
                $conn2->table('workflow_notification_logs')
                    ->where('id', $logId)
                    ->update([
                        'status' => 'failed',
                        'failed_at' => now(),
                        'last_error' => $e->getMessage(),
                        'updated_at' => now(),
                    ]);

                Log::error('TR notification failed', [
                    'tr_id' => $travelRequestId,
                    'recipient' => $user->ipms_id,
                    'error' => $e->getMessage(),
                ]);
            }
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
        return match ($action) {
            'submitted', 'resubmitted' => $this->reviewerTargets($conn2, $divisionId),
            'returned' => $returnToUser ? [[
                'emp_id' => $returnToUser,
                'required_action' => 'resubmit',
            ]] : [],
            default => [],
        };
    }

    private function reviewerTargets($conn2, $divisionId): array
    {
        $q = $conn2->table('travel_order_signatories')
            ->where('type', 'Reviewer_VR');

        $rows = $q->pluck('signatory')
            ->filter()
            ->map(fn ($empId) => [
                'emp_id' => (string) $empId,
                'required_action' => 'review',
            ])
            ->values()
            ->all();

        if (! empty($rows)) {
            return $rows;
        }

        return User::role('HRIS_PRU')
            ->pluck('ipms_id')
            ->filter()
            ->map(fn ($empId) => [
                'emp_id' => (string) $empId,
                'required_action' => 'review',
            ])
            ->values()
            ->all();
    }

    private function recordNotificationLog(
        $conn2,
        int $travelRequestId,
        string $action,
        string $status,
        ?string $recipientEmpId,
        ?string $recipientEmail,
        array $payload,
        array $meta,
        ?int $resendOfLogId = null,
    ): int {
        $existing = $conn2->table('workflow_notification_logs')
            ->where('process_key', 'travel_request')
            ->where('model_type', 'TravelRequest')
            ->where('model_id', $travelRequestId)
            ->where('recipient_emp_id', $recipientEmpId)
            ->where('notification_channel', 'mail')
            ->where('template_key', $this->templateKey($action))
            ->orderByDesc('id')
            ->first();

        $attempt = ((int) ($existing->attempt_count ?? 0)) + 1;

        return (int) $conn2->table('workflow_notification_logs')->insertGetId([
            'workflow_process_transition_id' => null,
            'process_key' => 'travel_request',
            'model_type' => 'TravelRequest',
            'model_id' => $travelRequestId,
            'recipient_emp_id' => $recipientEmpId,
            'recipient_email' => $recipientEmail,
            'notification_channel' => 'mail',
            'template_key' => $this->templateKey($action),
            'status' => $status,
            'attempt_count' => $attempt,
            'last_error' => null,
            'provider_message_id' => null,
            'payload' => json_encode($payload),
            'meta' => json_encode($meta),
            'queued_at' => now(),
            'sent_at' => $status === 'sent' ? now() : null,
            'failed_at' => $status === 'failed' ? now() : null,
            'resent_at' => $resendOfLogId ? now() : null,
            'resend_of_log_id' => $resendOfLogId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function templateKey(string $action): string
    {
        return match ($action) {
            'submitted' => 'travel_request.submitted',
            'returned' => 'travel_request.returned',
            'resubmitted' => 'travel_request.resubmitted',
            default => 'travel_request.unknown',
        };
    }

    private function intendedActorLabel(string $action, ?string $returnToUser, $divisionId): string
    {
        return match ($action) {
            'returned' => 'Request creator',
            'submitted', 'resubmitted' => 'Reviewer_VR signatory(ies)',
            default => 'Request creator',
        };
    }
}
