<?php

namespace App\Actions\Applicants;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Lorisleiva\Actions\Concerns\AsAction;

class StoreApplicant
{
    use AsAction;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && $request->user()->can('HRIS_recruitment.applicants.create');
    }

    public function asController(Request $request)
    {
        $action = app(StorePersonalInformation::class);
        $validator = Validator::make(
            $request->all(),
            $action->rules(),
            $action->getValidationMessages()
        );

        $action->withValidator($validator, \Lorisleiva\Actions\ActionRequest::createFromBase($request));

        return $action->handle($validator->validate());
    }
}
