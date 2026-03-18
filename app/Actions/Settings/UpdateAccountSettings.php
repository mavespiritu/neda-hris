<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateAccountSettings
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('account', 'settings');
    }

    public function asController(Request $request)
    {
        $user = $request->user();
        $validated = Validator::make($request->all(), [
            'last_name' => 'required|string|max:255',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'signature' => $user->signature ? 'nullable' : 'nullable|file|mimes:png,jpg,jpeg|max:4096',
            'digital_sig' => $user->digital_sig ? 'nullable' : 'nullable|file|mimetypes:application/x-pkcs12,application/octet-stream|max:4096',
        ], [
            'last_name.required' => 'The last name is required.',
            'first_name.required' => 'The first name is required.',
            'middle_name.string' => 'The middle name must be a valid string.',
            'signature.file' => 'The signature must be a valid file.',
            'signature.mimes' => 'The signature must be a PNG or JPG image.',
            'signature.max' => 'The signature must not be larger than 4MB.',
            'digital_sig.file' => 'The digital signature must be a valid file.',
            'digital_sig.mimes' => 'The digital signature must be a p12 file.',
            'digital_sig.max' => 'The digital signature must not be larger than 4MB.',
        ])->validate();

        $conn4 = DB::connection('mysql4');

        try {
            $conn4->beginTransaction();

            $updateData = [
                'last_name' => $validated['last_name'],
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
            ];

            if ($request->hasFile('signature')) {
                $updateData['signature'] = file_get_contents($request->file('signature')->getRealPath());
            }

            if ($request->hasFile('digital_sig')) {
                $updateData['digital_sig'] = file_get_contents($request->file('digital_sig')->getRealPath());
            }

            $conn4->table('users')
                ->where('id', $user->id)
                ->update($updateData);

            $conn4->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Account updated',
                'message' => 'Account settings were successfully updated.',
            ]);
        } catch (\Throwable $e) {
            $conn4->rollBack();
            Log::error('Failed to update account settings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Update failed',
                'message' => 'An error occurred while updating account settings.',
            ]);
        }
    }
}
