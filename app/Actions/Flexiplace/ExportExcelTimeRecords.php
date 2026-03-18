<?php

namespace App\Actions\Flexiplace;

use App\Exports\TimeRecordsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;
use Maatwebsite\Excel\Facades\Excel;

class ExportExcelTimeRecords
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('export', 'flexiplace.reports');
    }

    public function asController(Request $request)
    {
        return Excel::download(new TimeRecordsExport($request->input('date')), 'flexiplace_time_records.xlsx');
    }
}
