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
        $conn2 = DB::connection('mysql2');

        $file = $conn2->table('file')->find($id);

        if (!$file) {
            abort(404, 'File not found.');
        }

        if (Storage::disk('private')->exists($file->path)) {
            return Storage::disk('private')->download($file->path, $file->name);
        }

        if (Storage::disk('public')->exists($file->path)) {
            return Storage::disk('public')->download($file->path, $file->name);
        }

        abort(404, 'File missing in storage.');
    }
}
