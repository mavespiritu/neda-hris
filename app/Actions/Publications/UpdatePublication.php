<?php

namespace App\Actions\Publications;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Str;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class UpdatePublication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('edit', 'publications');
    }

    public function rules(): array
    {
        return [
            'date_published' => ['required', 'date'],
            'date_closed' => ['required', 'date'],
            'newFiles' => ['nullable', 'array', 'max:1'],
            'newFiles.*' => ['nullable', 'mimes:pdf,doc,docx', 'max:5120'],
        ];
    }

    public function getValidationMessages(): array
    {
        return [
            'date_published.required' => 'The posting date is required.',
            'date_closed.required' => 'The closing date is required.',
            'newFiles.max' => 'Only 1 file may be uploaded.',
            'newFiles.*.mimes' => 'Files must be a PDF or Word document.',
            'newFiles.*.max' => 'Files may not be greater than 5MB.',
        ];
    }

    public function asController(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), $this->rules(), $this->getValidationMessages());
        $validator->after(function ($validator) use ($request) {
            $publishedDate = Carbon::parse($request->date_published)->startOfDay();
            $closedDate = Carbon::parse($request->date_closed)->startOfDay();

            if ($closedDate->lt($publishedDate)) {
                $validator->errors()->add('date_closed', 'The closing date must be on or after the posting date.');
            }
        });
        $validator->validate();

        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $conn2->table('publication')
                ->where('id', $id)
                ->update([
                    'date_published' => Carbon::parse($request->date_published)->format('Y-m-d'),
                    'date_closed' => Carbon::parse($request->date_closed)->format('Y-m-d'),
                    'updated_by' => Auth::user()->ipms_id,
                    'date_updated' => Carbon::now()->format('Y-m-d H:i:s'),
                ]);

            $year = Carbon::now()->year;

            if ($request->filled('removeFiles')) {
                foreach ($request->removeFiles as $fileId) {
                    $file = $conn2->table('file')
                        ->where('id', $fileId)
                        ->where('model', 'Publication')
                        ->first();

                    if ($file) {
                        Storage::disk('public')->delete($file->path);

                        $conn2->table('file')
                            ->where('id', $fileId)
                            ->where('model', 'Publication')
                            ->delete();
                    }
                }
            }

            if ($request->hasFile('newFiles')) {
                foreach ($request->file('newFiles') as $file) {
                    $filename = Str::random(20) . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('uploads/publications/' . $year, $filename, 'public');

                    $conn2->table('file')->insert([
                        'model' => 'Publication',
                        'itemId' => $id,
                        'name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'hash' => $file->hashName(),
                        'type' => $file->getClientOriginalExtension(),
                        'date_upload' => now()->timestamp,
                    ]);
                }
            }

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request updated successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to update request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while updating the request. Please try again.',
            ]);
        }
    }
}
