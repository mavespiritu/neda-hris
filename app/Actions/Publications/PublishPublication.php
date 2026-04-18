<?php

namespace App\Actions\Publications;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Lorisleiva\Actions\Concerns\AsAction;

class PublishPublication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.publications.publish');
    }

    public function asController(Request $request, int $id)
    {

        $conn2 = DB::connection('mysql2');

        $publication = $conn2->table('publication')->where('id', $id)->first();

        if (! $publication) {
            return response()->json(['error' => 'Publication not found'], 404);
        }

        $newVisibility = ! $publication->is_public;

        $conn2->table('publication')->where('id', $id)->update([
            'is_public' => $newVisibility,
            'updated_by' => Auth::user()->ipms_id,
            'date_updated' => now(),
        ]);

        return redirect()->back()->with([
            'status' => 'success',
            'title' => 'Success!',
            'message' => 'Visibility toggled successfully.',
        ]);
    }
}
