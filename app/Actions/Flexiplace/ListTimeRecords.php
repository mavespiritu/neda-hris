<?php

namespace App\Actions\Flexiplace;

use App\Traits\FetchFlexiplaceRecords;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class ListTimeRecords
{
    use AsAction;
    use FetchFlexiplaceRecords;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('show', 'flexiplace.reports');
    }

    public function asController(Request $request)
    {
        $date = $request->input('date');
        $timeRecords = $this->fetchFlexiplaceRecords($date);

        return response()->json([
            'data' => [
                'timeRecords' => $timeRecords,
            ],
        ]);
    }
}
