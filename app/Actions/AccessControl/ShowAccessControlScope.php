<?php

namespace App\Actions\AccessControl;

use App\Actions\AccessControl\Concerns\BuildsAccessControlData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Lorisleiva\Actions\Concerns\AsAction;

class ShowAccessControlScope
{
    use AsAction;
    use BuildsAccessControlData;

    public function authorize(Request $request): bool
    {
        return $this->canAccess($request);
    }

    public function asController(Request $request): Response
    {
        return Inertia::render('AccessControl/Scope', [
            'user' => $this->currentUserPayload(),
            'role_priorities' => $this->rolePriorities(),
        ]);
    }
}

