<?php

namespace App\Actions\Competencies;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowLibraries
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('libraries', 'gap-analysis');
    }

    public function asController(Request $request)
    {
        return Inertia::render('Competencies/Libraries/index');
    }
}
