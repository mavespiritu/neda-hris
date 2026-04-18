<?php

namespace App\Actions\TravelRequests;

use App\Services\TravelRequests\TravelRequestReportBuilder;
use App\Services\TravelRequests\TravelRequestReportPdfService;
use App\Traits\AuthorizesTravelRequests;
use Illuminate\Support\Facades\View;
use Lorisleiva\Actions\ActionRequest;
use Lorisleiva\Actions\Concerns\AsAction;

class GenerateTravelRequestReport
{
    use AsAction, AuthorizesTravelRequests;

    public function authorize(ActionRequest $request): bool
    {
        $id = (int) $request->route('id');

        return $this->canGenerateTravelRequest($request->user(), $id);
    }

    public function asController(ActionRequest $request, TravelRequestReportBuilder $builder, TravelRequestReportPdfService $pdfService)
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

        $preview = $request->boolean('preview');

        $viewData = [
            'travelOrder' => $report['travelOrder'],
            'preview' => $preview,
        ];

        if ($request->boolean('pdf') || $preview) {
            $temp = $pdfService->ensureUnsignedPdf($id);

            if (! $temp) {
                return redirect()->route('travel-requests.index')->with([
                    'status' => 'error',
                    'title' => 'Not found',
                    'message' => 'Travel request not found.',
                ]);
            }

            return response()->file($temp['path'], [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $temp['filename'] . '"',
            ]);
        }

        return view('reports.to', $viewData);
    }

}
