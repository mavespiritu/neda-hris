<?php

namespace App\Actions\Vacancies;

use App\Models\AppExamResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreApplicantExamResult
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

    public function asController(Request $request, int $vacancy, int $application)
    {
        $validated = $request->validate([
            'test_type' => ['required', Rule::in(['Skill Test', 'DPE'])],
            'date_conducted' => ['required', 'date'],
            'status' => ['required', 'string', 'max:100'],
            'score' => ['nullable', 'string', 'max:100'],
            'removeFiles' => ['nullable', 'array', 'max:1'],
            'removeFiles.*' => ['nullable', 'integer'],
            'attachment' => ['nullable', 'file', 'max:5120', 'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx'],
        ]);

        $ipmsId = $request->user()?->ipms_id;
        $attachment = $request->file('attachment');
        $removeFiles = collect($request->input('removeFiles', []))->filter()->map(fn ($id) => (int) $id);
        $fileModel = $this->fileModelForTestType($validated['test_type']);

        $result = AppExamResult::query()->firstOrNew([
            'application_id' => $application,
            'vacancy_id' => $vacancy,
            'test_type' => $validated['test_type'],
        ]);

        $existingFile = null;
        if ($result->exists) {
            $existingFile = DB::connection('mysql2')
                ->table('file')
                ->where('model', $fileModel)
                ->where('itemId', $result->id)
                ->first();
        }

        $result->date_conducted = $validated['date_conducted'];
        $result->status = $validated['status'];
        $result->score = $validated['score'] ?? null;
        $result->created_by = $result->exists ? $result->created_by : $ipmsId;
        $result->updated_by = $ipmsId;
        $result->save();

        if ($removeFiles->isNotEmpty() && $existingFile && $removeFiles->contains((int) $existingFile->id)) {
            $this->deleteStoredFile($existingFile->path);

            DB::connection('mysql2')
                ->table('file')
                ->where('id', $existingFile->id)
                ->where('model', $fileModel)
                ->delete();

            $existingFile = null;
        }

        if ($attachment) {
            if ($existingFile) {
                $this->deleteStoredFile($existingFile->path);

                DB::connection('mysql2')
                    ->table('file')
                    ->where('id', $existingFile->id)
                    ->where('model', $fileModel)
                    ->delete();
            }

            $this->storeAttachment($result->id, $fileModel, $validated['test_type'], $vacancy, $application, $attachment);
        }

        return response()->json([
            'status' => 'success',
            'title' => 'Success!',
            'message' => $validated['test_type'] . ' result saved successfully.',
            'data' => $this->payloadWithAttachment($result->fresh(), $fileModel),
        ]);
    }

    private function fileModelForTestType(string $testType): string
    {
        return $testType === 'Skill Test' ? 'SkillsTestResult' : 'DPETestResult';
    }

    private function storeAttachment(int $resultId, string $fileModel, string $testType, int $vacancy, int $application, $attachment): void
    {
        $folder = sprintf(
            'uploads/vacancies/exam-results/%d/%d/%s',
            $vacancy,
            $application,
            Str::slug($testType)
        );
        $filename = sprintf(
            '%s_%s.%s',
            now()->format('YmdHis'),
            Str::random(8),
            strtolower($attachment->getClientOriginalExtension() ?: $attachment->extension() ?: 'bin')
        );

        $storedPath = $attachment->storeAs($folder, $filename, 'private');

        DB::connection('mysql2')->table('file')->insert([
            'model' => $fileModel,
            'itemId' => $resultId,
            'name' => $attachment->getClientOriginalName() ?: $filename,
            'path' => $storedPath,
            'size' => (int) $attachment->getSize(),
            'mime' => $attachment->getMimeType() ?: $attachment->getClientMimeType(),
            'hash' => $attachment->hashName(),
            'type' => strtolower($attachment->getClientOriginalExtension() ?: $attachment->extension() ?: 'bin'),
            'date_upload' => now()->timestamp,
        ]);
    }

    private function payloadWithAttachment(AppExamResult $result, string $fileModel): array
    {
        $file = DB::connection('mysql2')
            ->table('file')
            ->where('model', $fileModel)
            ->where('itemId', $result->id)
            ->first();

        return [
            'id' => $result->id,
            'application_id' => $result->application_id,
            'vacancy_id' => $result->vacancy_id,
            'test_type' => $result->test_type,
            'date_conducted' => $result->date_conducted,
            'status' => $result->status,
            'score' => $result->score,
            'attachment' => $file ? [
                'id' => $file->id,
                'model' => $file->model,
                'itemId' => $file->itemId,
                'name' => $file->name,
                'path' => $file->path,
                'size' => $file->size,
                'mime' => $file->mime,
                'hash' => $file->hash,
                'type' => $file->type,
                'date_upload' => $file->date_upload,
                'preview_url' => route('files.preview', $file->id),
            ] : null,
        ];
    }

    private function deleteStoredFile(?string $path): void
    {
        if (! $path) {
            return;
        }

        if (Storage::disk('private')->exists($path)) {
            Storage::disk('private')->delete($path);
            return;
        }

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }
}