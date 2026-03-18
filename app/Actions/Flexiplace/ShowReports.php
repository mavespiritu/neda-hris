<?php

namespace App\Actions\Flexiplace;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowReports
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('show', 'flexiplace.reports');
    }

    public function asController(Request $request)
    {
        return Inertia::render('Dtr/Report/index');
    }
}
