<?php

namespace App\Actions\Publications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Lorisleiva\Actions\Concerns\AsAction;

class BulkDeletePublication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.publications.delete');
    }

    public function asController(Request $request)
    {
        $conn2 = DB::connection('mysql2');
        $ids = $request->input('ids');

        try {
            $conn2->beginTransaction();

            $vacancies = $conn2->table('publication_vacancies')
                ->whereIn('publication_id', $ids)
                ->pluck('vacancy_id')
                ->toArray();

            if (! empty($vacancies)) {
                $conn2->table('vacancy')
                    ->whereIn('id', $vacancies)
                    ->update(['status' => 'Open']);
            }

            $files = $conn2->table('file')
                ->where('model', 'Publication')
                ->whereIn('itemId', $ids)
                ->get();

            foreach ($files as $file) {
                if ($file->path && Storage::disk('public')->exists($file->path)) {
                    Storage::disk('public')->delete($file->path);
                }

                $conn2->table('file')->where('id', $file->id)->delete();
            }

            $conn2->table('publication_vacancies')->whereIn('publication_id', $ids)->delete();
            $conn2->table('publication')->whereIn('id', $ids)->delete();

            $conn2->commit();

            return redirect()->back()->with([
                'status' => 'success',
                'title' => 'Success!',
                'message' => 'Request(s) deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            $conn2->rollBack();
            Log::error('Failed to delete request(s): ' . $e->getMessage());

            return redirect()->back()->with([
                'status' => 'error',
                'title' => 'Uh oh! Something went wrong.',
                'message' => 'An error occurred while deleting the request(s). Please try again.',
            ]);
        }
    }
}
