<?php

namespace App\Actions\VehicleRequests;

use App\Models\User;
use App\Models\VehicleRequest;
use App\States\VehicleRequest\Approved as VrApproved;
use App\States\VehicleRequest\Endorsed as VrEndorsed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;
use RuntimeException;

class ApproveVehicleRequestViaEmail
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        return true;
    }

    public function handle(string $token): string
    {
        $conn2 = DB::connection('mysql2');
        $conn4 = DB::connection('mysql4');

        return DB::transaction(function () use ($conn2, $conn4, $token) {
            $link = $conn4->table('email_links')->where('token', $token)->lockForUpdate()->first();

            if (! $link) throw new RuntimeException('Invalid link.');
            if (now()->greaterThan($link->expires_at)) return 'This link has expired.';
            if ((int) $link->is_used === 1) return 'This link has already been used.';
            if (($link->model ?? null) !== 'Vehicle Request') throw new RuntimeException('Invalid link target.');

            $user = User::find($link->user_id);
            if (! $user) throw new RuntimeException('User not found.');

            $vr = VehicleRequest::on('mysql2')->whereKey((int) $link->model_id)->lockForUpdate()->first();
            if (! $vr) throw new RuntimeException('Vehicle request not found.');
            if (! ($vr->state instanceof VrEndorsed)) return 'Vehicle request is not in endorsed status.';

            $vr->state->transitionTo(VrApproved::class, (string) $user->ipms_id, null, true);

            $conn4->table('email_links')->where('token', $token)->update(['is_used' => true]);

            Log::info("VR {$vr->id} approved via email by {$user->email}");
            return 'You have successfully approved the vehicle request.';
        });
    }

    public function asController(ActionRequest $request, string $token)
    {
        try {
            $message = $this->handle($token);
            return Inertia::render('ThankYou', ['message' => $message]);
        } catch (\Throwable $e) {
            Log::error('Failed email approval for VR: ' . $e->getMessage());
            return Inertia::render('ThankYou', ['message' => 'Something went wrong. Please contact the ICT Unit.']);
        }
    }
}
