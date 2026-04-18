<?php

namespace App\Actions\Publications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Lorisleiva\Actions\Concerns\AsAction;

class DeletePublication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.publications.delete');
    }

    public function asController(int $id)
    {
        $conn2 = DB::connection('mysql2');

        try {
            $conn2->beginTransaction();

            $publication = $conn2->table('publication')->where('id', $id)->first();

            if (! $publication) {
                abort(404, 'Page not found.');
            }

            $vacancies = $conn2->table('publication_vacancies')
                ->where('publication_id', $publication->id)
                ->pluck('vacancy_id')
                ->toArray();

            if (! empty($vacancies)) {
                $conn2->table('vacancy')
                    ->whereIn('id', $vacancies)
                    ->update(['status' => 'Open']);
            }

            $files = $conn2->table('file')
                ->where('model', 'Publication')
                ->where('itemId', $publication->id)
                ->get();

            foreach ($files as $file) {
                if ($file->path && Storage::disk('public')->exists($file->path)) {
                    Storage::disk('public')->delete($file->path);
                }

                $conn2->table('file')->where('id', $file->id)->delete();
            }

            $conn2->table('publication_vacancies')->where('publication_id', $publication->id)->delete();
            $conn2->table('publication')->where('id', $publication->id)->delete();

            $conn2->commit();

            return redirect()->route('publications.index')->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to delete request: ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the request. Please try again.',
            ]);
        }
    }
}
