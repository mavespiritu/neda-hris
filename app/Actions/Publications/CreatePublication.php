<?php

namespace App\Actions\Publications;

use App\Services\Publications\PublicationFormBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;

class CreatePublication
{
    use AsAction;

    public function __construct(protected PublicationFormBuilder $builder)
    {
    }

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.publications.create');
    }

    public function asController()
    {
        return response()->json($this->builder->build(DB::connection('mysql2')));
    }
}
