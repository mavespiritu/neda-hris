<?php

namespace App\Actions\Applications;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class CreateApplication
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applications.create');
    }

    public function asController()
    {
        return Inertia::render('Applications/Create');
    }
}
