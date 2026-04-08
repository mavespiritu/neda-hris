<?php

namespace App\Http\Controllers\Opcr;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OpcrController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        abort_unless($user?->hasAnyRole(['HRIS_DC', 'HRIS_RD', 'HRIS_ARD']), 403, 'Only office-level performance users can access OPCR.');

        return Inertia::render('Performance/Opcr/index', [
            'summary' => [
                'program_count' => 0,
                'activity_count' => 0,
                'monitoring_link' => route('emails.index'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        abort(405);
    }

    public function show(string $id)
    {
        abort(404);
    }

    public function update(Request $request, string $id)
    {
        abort(405);
    }

    public function destroy(string $id)
    {
        abort(405);
    }
}
