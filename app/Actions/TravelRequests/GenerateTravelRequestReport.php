<?php

namespace App\Actions\TravelRequests;

use App\Services\TravelRequests\TravelRequestReportBuilder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class GenerateTravelRequestReport
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('tr.generate', $id);
    }

    public function asController(ActionRequest $request, TravelRequestReportBuilder $builder)
    {
        $id = (int) $request->route('id');

        $report = $builder->build($id);

        if (! $report) {
            return redirect()->route('travel-requests.index')->with([
                'status' => 'error',
                'title' => 'Not found',
                'message' => 'Travel request not found.',
            ]);
        }

        if (! $request->boolean('pdf')) {
            return view('reports.to', [
                'travelOrder' => $report['travelOrder'],
            ]);
        }

        $pdf = Pdf::loadView('reports.to', [
            'travelOrder' => $report['travelOrder'],
        ])->setPaper('a4', 'landscape');

        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'dpi' => 96,
            'defaultFont' => 'Arial',
        ]);

        return $pdf->stream($report['filename']);
    }
}
