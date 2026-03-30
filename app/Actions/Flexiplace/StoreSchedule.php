<?php

namespace App\Actions\Flexiplace;

use Illuminate\Http\Request;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreSchedule
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return false;
    }

    public function asController(Request $request)
    {
        abort(404);
    }
}
