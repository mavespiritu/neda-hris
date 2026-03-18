<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Lorisleiva\Actions\Concerns\AsAction;

class GetAccountSettings
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('account', 'settings');
    }

    public function asController(Request $request)
    {
        try {
            $user = $request->user();

            if (! $user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated.',
                ], 401);
            }

            $signature = null;
            if ($user->signature) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_buffer($finfo, $user->signature);
                finfo_close($finfo);
                $signature = 'data:' . $mimeType . ';base64,' . base64_encode($user->signature);
            }

            return response()->json([
                'last_name' => $user->last_name ?? '',
                'first_name' => $user->first_name ?? '',
                'middle_name' => $user->middle_name ?? '',
                'signature' => $signature,
                'digital_sig' => $user->digital_sig ? 'exists' : null,
            ]);
        } catch (\Throwable $e) {
            Log::error('Account fetch failed: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Could not fetch account.',
            ], 500);
        }
    }
}
