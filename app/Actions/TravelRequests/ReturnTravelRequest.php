<?php

namespace App\Actions\TravelRequests;

use App\Models\TravelRequest;
use App\States\TravelRequest\Returned;
use App\States\TravelRequest\Submitted;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class ReturnTravelRequest
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('tr.return', $id);
    }

    public function rules(): array
    {
        return [
            'remarks' => ['required', 'string'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'remarks.required' => 'Remarks is required when returning a travel request.',
        ];
    }

    public function handle(int $id, string $actedBy, string $remarks): void
    {
        $conn2 = DB::connection('mysql2');

        $conn2->transaction(function () use ($conn2, $id, $actedBy, $remarks) {
            $travelRequest = TravelRequest::query()
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $travelRequest) {
                throw new RuntimeException('Travel request not found.');
            }

            $isReturnable =
                $travelRequest->state instanceof Submitted;

            if (! $isReturnable) {
                throw new RuntimeException('Current travel request status cannot be returned.');
            }

            $returnToState = $travelRequest->state->label();
            $returnToUser = (string) $travelRequest->created_by;

            $travelRequest->state->transitionTo(
                Returned::class,
                $actedBy,
                $returnToState,
                $returnToUser,
                $remarks,
                true
            );

            $travelRequest->refresh();
        });
    }

    public function asController(ActionRequest $request)
    {
        $id = (int) $request->route('id');

        try {
            $this->handle(
                id: $id,
                actedBy: (string) $request->user()->ipms_id,
                remarks: (string) $request->validated('remarks')
            );

            return back()->with([
                'status' => 'success',
                'title' => 'Returned',
                'message' => 'Travel request returned successfully.',
            ]);
        } catch (RuntimeException $e) {
            return back()->withErrors(['remarks' => $e->getMessage()])->withInput();
        } catch (\Throwable $e) {
            Log::error("ReturnTravelRequest failed [TR:{$id}] {$e->getMessage()}");

            return back()->withErrors([
                'remarks' => $e->getMessage() ?: 'An unexpected error occurred while returning the travel request.',
            ])->withInput();
        }
    }
}
