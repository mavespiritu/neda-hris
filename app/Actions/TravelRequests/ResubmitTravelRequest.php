<?php

namespace App\Actions\TravelRequests;

use App\Models\TravelRequest;
use App\States\TravelRequest\Resubmitted;
use App\States\TravelRequest\Returned;
use App\States\TravelRequest\Submitted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class ResubmitTravelRequest
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('tr.resubmit', $id);
    }

    public function rules(): array
    {
        return [];
    }

    public function handle(int $id, string $actedBy): void
    {
        DB::connection('mysql2')->transaction(function () use ($id, $actedBy) {
            $travelRequest = TravelRequest::on('mysql2')
                ->whereKey($id)
                ->lockForUpdate()
                ->first();

            if (! $travelRequest) {
                throw new RuntimeException('Travel request record not found.');
            }

            if (! ($travelRequest->state instanceof Returned)) {
                throw new RuntimeException('Only returned travel requests can be resubmitted.');
            }

            $targetLabel = trim((string) $travelRequest->tr_return_to_state);
            $returnToUser = trim((string) $travelRequest->tr_return_to_user);

            if ($targetLabel === '' || $returnToUser === '') {
                throw new RuntimeException('Return target is missing. Cannot resubmit.');
            }

            $targetClass = $this->targetStateClass($targetLabel);

            // Returned -> Resubmitted
            $travelRequest->state->transitionTo(Resubmitted::class, $actedBy);
            $travelRequest->refresh();

            // Resubmitted -> original target
            $travelRequest->state->transitionTo($targetClass, $actedBy);
            $travelRequest->refresh();

            // optional cleanup
            $travelRequest->tr_status_remarks = null;
            $travelRequest->tr_return_to_user = null;
            $travelRequest->save();
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle($id, (string) $request->user()->ipms_id);

            return back()->with([
                'status' => 'success',
                'title' => 'Resubmitted',
                'message' => 'Travel request resubmitted successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['travel_request' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error("ResubmitTravelRequest failed [TR:{$id}] {$e->getMessage()}");

            return back()->withErrors([
                'travel_request' => 'Failed to resubmit travel request.',
            ]);
        }
    }

    private function targetStateClass(string $label): string
    {
        return match ($label) {
            'Submitted' => Submitted::class,
            default => throw new RuntimeException("Invalid return target state: {$label}"),
        };
    }
}
