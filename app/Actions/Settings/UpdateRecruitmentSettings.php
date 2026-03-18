<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdateRecruitmentSettings
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('recruitment', 'settings');
    }

    public function asController(Request $request)
    {
        Validator::make($request->all(), [
            'requirements' => 'nullable|array',
            'requirements.*.requirement' => 'required|string|max:255',
            'requirements.*.is_default' => 'boolean',
            'requirements.*.is_multiple' => 'boolean',
            'requirements.*.id' => 'nullable|integer|exists:mysql2.recruitment_requirements,id',
        ], [
            'requirements.*.requirement.required' => 'The requirement field is required.',
            'requirements.*.is_default.boolean' => 'The "is default" value must be true or false.',
            'requirements.*.is_multiple.boolean' => 'The "is multiple" value must be true or false.',
        ])->validate();

        $requirements = $request['requirements'] ?? [];
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $incomingIds = collect($requirements)->pluck('id')->filter()->toArray();

            if (! empty($incomingIds)) {
                $conn2->table('recruitment_requirements')
                    ->whereNotIn('id', $incomingIds)
                    ->delete();
            } else {
                $conn2->table('recruitment_requirements')->delete();
            }

            foreach ($requirements as $req) {
                if (! empty($req['id'])) {
                    $conn2->table('recruitment_requirements')
                        ->where('id', $req['id'])
                        ->update([
                            'requirement' => $req['requirement'],
                            'is_default' => $req['is_default'] ?? false,
                            'is_multiple' => $req['is_multiple'] ?? false,
                            'connected_to' => $req['connected_to'] ?? null,
                        ]);
                } else {
                    $conn2->table('recruitment_requirements')->insert([
                        'requirement' => $req['requirement'],
                        'is_default' => $req['is_default'] ?? false,
                        'is_multiple' => $req['is_multiple'] ?? false,
                        'connected_to' => $req['connected_to'] ?? null,
                    ]);
                }
            }

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Recruitment settings updated',
                'message' => 'Recruitment settings updated successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to update recruitment settings: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Update failed',
                'message' => 'An error occurred while updating recruitment settings.',
            ]);
        }
    }
}
