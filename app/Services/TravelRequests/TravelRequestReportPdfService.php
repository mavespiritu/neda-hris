<?php

namespace App\Services\TravelRequests;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\View;

class TravelRequestReportPdfService
{
    public function __construct(
        private readonly TravelRequestReportBuilder $builder
    ) {
    }

    public function ensureUnsignedPdf(int $id): ?array
    {
        $report = $this->builder->build($id);

        if (! $report) {
            return null;
        }

        $path = $this->tempPdfPath($id);
        $this->writePdf($report['travelOrder'], $report['filename'], $path);

        return [
            'report' => $report,
            'path' => $path,
            'filename' => $report['filename'],
        ];
    }

    public function tempPdfPath(int $id): string
    {
        return storage_path("app/temp/travel-requests/travel-request-{$id}.pdf");
    }

    private function writePdf(array $travelOrder, string $filename, string $path): void
    {
        File::ensureDirectoryExists(dirname($path));

        $html = View::make('reports.to', [
            'travelOrder' => $travelOrder,
            'preview' => true,
            'signatureMode' => 'none',
            'signatureImage' => null,
            'signerName' => '',
            'signedAt' => '',
        ])->render();

        $pdf = new \TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
        $pdf->SetCreator(config('app.name'));
        $pdf->SetAuthor(config('app.name'));
        $pdf->SetTitle($filename);
        $pdf->SetMargins(10, 10, 10);
        $pdf->SetAutoPageBreak(true, 10);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->AddPage();
        $pdf->writeHTML($html, true, false, true, false, '');
        $pdf->Output($path, 'F');
    }
}