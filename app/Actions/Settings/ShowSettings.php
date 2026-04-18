<?php

namespace App\Actions\Settings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowSettings
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_settings.page.view');
    }

    public function asController()
    {
        return Inertia::render('Settings/index');
    }
}
