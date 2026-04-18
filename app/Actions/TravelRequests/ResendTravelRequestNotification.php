<?php

namespace App\Actions\TravelRequests;

use App\Models\TravelRequest;
use App\Traits\AuthorizesTravelRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class ResendTravelRequestNotification
{
    use AsAction, AuthorizesTravelRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');

        return $this->canViewTravelRequest($request->user(), $id);
    }

    public function rules(): array
    {
        return [
            'step' => ['required', 'string', 'in:Submitted,Returned,Resubmitted'],
        ];
    }

    public function handle(int $id, string $step, string $actedBy): void
    {
        $conn2 = DB::connection('mysql2');

        $travelRequest = TravelRequest::on('mysql2')
            ->whereKey($id)
            ->first();

        if (! $travelRequest) {
            throw new RuntimeException('Travel request not found.');
        }

        $step = trim($step);
        [$action, $fromState, $toState, $returnToState, $returnToUser] = match ($step) {
            'Submitted' => ['submitted', 'Draft', 'Submitted', null, null],
            'Returned' => ['returned', 'Submitted', 'Returned', 'Submitted', (string) $travelRequest->created_by],
            'Resubmitted' => ['resubmitted', 'Returned', 'Resubmitted', null, null],
            default => throw new RuntimeException('Invalid notification step.'),
        };

        $templateKey = match ($action) {
            'submitted' => 'travel_request.submitted',
            'returned' => 'travel_request.returned',
            'resubmitted' => 'travel_request.resubmitted',
            default => 'travel_request.unknown',
        };

        $previousLogId = $conn2->table('workflow_notification_logs')
            ->where('process_key', 'travel_request')
            ->where('model_type', 'TravelRequest')
            ->where('model_id', $id)
            ->where('template_key', $templateKey)
            ->orderByDesc('id')
            ->value('id');

        DispatchTravelRequestNotification::run(
            travelRequestId: $id,
            action: $action,
            fromState: $fromState,
            toState: $toState,
            actedBy: $actedBy,
            remarks: null,
            returnToState: $returnToState,
            returnToUser: $returnToUser,
            resendOfLogId: $previousLogId ? (int) $previousLogId : null,
        );
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');
        $step = (string) $request->validated('step');

        try {
            $this->handle($id, $step, (string) $request->user()->ipms_id);

            return back()->with([
                'status' => 'success',
                'title' => 'Sent',
                'message' => 'Email notification resent successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->with([
                'status' => 'error',
                'title' => 'Resend failed',
                'message' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            Log::error("ResendTravelRequestNotification failed [TR:{$id}] {$e->getMessage()}");

            return back()->with([
                'status' => 'error',
                'title' => 'Resend failed',
                'message' => 'Unable to resend the email notification.',
            ]);
        }
    }
}
