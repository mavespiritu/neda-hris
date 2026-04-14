<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Storage;



class FileController extends Controller
{
    public function download($id)
    {
        return $this->serveFile($id, true);
    }

    public function preview($id)
    {
        return $this->serveFile($id, false);
    }

    private function serveFile($id, bool $download)
    {
        $conn2 = DB::connection('mysql2');

        $file = $conn2->table('file')->find($id);

        if (! $file) {
            abort(404, 'File not found.');
        }

        foreach (['private', 'public'] as $diskName) {
            $disk = Storage::disk($diskName);

            if (! $disk->exists($file->path)) {
                continue;
            }

            $headers = [
                'Content-Type' => $file->mime ?: $disk->mimeType($file->path),
                'Content-Disposition' => ($download ? 'attachment' : 'inline') . '; filename="' . addslashes($file->name) . '"',
            ];

            return $disk->response($file->path, $file->name, $headers);
        }

        abort(404, 'File missing in storage.');
    }
}
