<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Lorisleiva\Actions\Concerns\AsAction;

class DeleteApplicantExamAttachment
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && (
                $request->user()->can('HRIS_recruitment.vacancies.assessment.skills-test.log')
                || $request->user()->can('HRIS_recruitment.vacancies.assessment.dpe-test.log')
            );
    }

    public function asController(Request $request, int $id)
    {
        $conn2 = DB::connection('mysql2');

        $file = $conn2->table('file')->where('id', $id)->first();

        if (! $file) {
            abort(404, 'File not found.');
        }

        if (! in_array($file->model, ['SkillsTestResult', 'DPETestResult'], true)) {
            abort(403, 'You are not allowed to delete this file.');
        }

        if ($file->path) {
            if (Storage::disk('private')->exists($file->path)) {
                Storage::disk('private')->delete($file->path);
            } elseif (Storage::disk('public')->exists($file->path)) {
                Storage::disk('public')->delete($file->path);
            }
        }

        $conn2->table('file')->where('id', $id)->delete();

        return response()->json([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Attachment deleted successfully.',
        ]);
    }
}
