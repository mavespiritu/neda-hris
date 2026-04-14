<?php

namespace App\Actions\Vacancies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Lorisleiva\Actions\Concerns\AsAction;
use ZipArchive;

class DownloadApplicantRequirements
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.vacancies.applicants.documents.download');
    }

    public function asController(Request $request, int $id)
    {
        $conn = DB::connection('mysql');
        $conn2 = DB::connection('mysql2');

        $application = $conn->table('application')->where('id', $id)->first();

        if (! $application) {
            abort(404, 'Application not found');
        }

        $applicant = $conn->table('application_applicant')->where('application_id', $application->id)->first();
        $vacancy = $conn2->table('vacancy')->where('id', $application->vacancy_id)->first();

        $support = app(ApplicantDataSupport::class);
        $lastName = $support->normalizeFilenamePart(strtoupper((string) ($applicant->last_name ?? 'APPLICANT')));
        $itemNo = $support->normalizeFilenamePart($vacancy->item_no ?? 'ITEM');

        $zipFileName = sprintf('%s_%s_%s.zip', $lastName, $itemNo, now()->format('mdYHis'));
        $requirements = $support->buildRequirementTreeData($application);
        $filePaths = $support->extractFilePaths($requirements);

        $zipPath = storage_path("app/temp/{$zipFileName}");

        if (! is_dir(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        $zip = new ZipArchive();

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Unable to create ZIP file.');
        }

        foreach ($filePaths as $relativePath) {
            $disk = 'public';

            if (! Storage::disk($disk)->exists($relativePath)) {
                continue;
            }

            $absolutePath = Storage::disk($disk)->path($relativePath);
            $zip->addFile($absolutePath, basename($relativePath));
        }

        $zip->close();

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
}
