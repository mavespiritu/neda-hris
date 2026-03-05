<?php

namespace App\Actions\TravelRequests;

use App\Services\TripTickets\TripTicketReportBuilder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class GenerateTripTicketReport
{
    use AsAction;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');
        return Gate::forUser($request->user())->allows('tt.generate', $id);
    }

    public function asController(ActionRequest $request, TripTicketReportBuilder $builder)
    {
        $id = (int) $request->route('id');

        $report = $builder->build($id);

        if (! $report) {
            return redirect()->route('trip-tickets.index')->with([
                'status' => 'error',
                'title' => 'Not found',
                'message' => 'Trip ticket not found.',
            ]);
        }

        if (! $request->boolean('pdf')) {
            return view('reports.trip-ticket', [
                'tripTicket' => $report['tripTicket'],
            ]);
        }

        $pdf = Pdf::loadView('reports.trip-ticket', [
            'tripTicket' => $report['tripTicket'],
        ])->setPaper('a4', 'landscape');

        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'dpi' => 96,
            'defaultFont' => 'Arial',
            'isPhpEnabled' => true,
        ]);

        return $pdf->stream($report['filename']);
    }
}
