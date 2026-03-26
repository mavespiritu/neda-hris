<?php

namespace App\Actions\Performance;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowOpcr
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('opcr', 'performance');
    }

    public function asController(Request $request): Response
    {
        return Inertia::render('Opcr/index', [
            'summary' => [
                'program_count' => 5,
                'activity_count' => 5,
                'monitoring_link' => route('emails.index'),
            ],
        ]);
    }
}
