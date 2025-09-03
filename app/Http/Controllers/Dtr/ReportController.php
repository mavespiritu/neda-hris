<?php

namespace App\Http\Controllers\Dtr;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Exports\TimeRecordsExport;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\Style\Section;
use App\Traits\FetchFlexiplaceRecords;

class ReportController extends Controller
{
    use FetchFlexiplaceRecords;

    public function index(Request $request)
    {
        return Inertia::render('Dtr/Report/index');
    }

    public function timeRecords(Request $request)
    {
        $date = $request->date ?? null;
        $timeRecords = $this->fetchFlexiplaceRecords($date);

        return response()->json([
            'data' => [
                'timeRecords' => $timeRecords
            ]
        ]);
    }

    public function exportExcelTimeRecords(Request $request)
    {
        return Excel::download(new TimeRecordsExport($request->date), 'flexiplace_time_records.xlsx');
    }

    public function exportWordTimeRecords(Request $request)
    {
        $date = $request->date ? Carbon::parse($request->date)->format('Y-m-d') : Carbon::today()->format('Y-m-d');

        $timeRecords = $this->fetchFlexiplaceRecords($date);

        $phpWord = new PhpWord();
        $section = $phpWord->addSection([
            'orientation' => Section::ORIENTATION_LANDSCAPE
        ]);
        $section->addText("Date of Flexiplace: {$date}", ['size' => 12]);

        $tableStyle = [
            'borderSize' => 6,
            'borderColor' => '000000',
            'cellMargin' => 80
        ];

        $firstRowStyle = ['bgColor' => 'DDDDDD'];
        $phpWord->addTableStyle('TimeRecordsTable', $tableStyle);
        $table = $section->addTable('TimeRecordsTable');

        $fontStyle = ['size' => 9]; // Define font size

        // Header Row
        $table->addRow();
        $table->addCell(2000, ['vMerge' => 'restart'])->addText("Division", array_merge($fontStyle, ['bold' => true]));
        $table->addCell(3000, ['vMerge' => 'restart'])->addText("Name", array_merge($fontStyle, ['bold' => true]));
        $table->addCell(2000, ['gridSpan' => 2])->addText("Actual AM", array_merge($fontStyle, ['bold' => true]), ['align' => 'center']);
        $table->addCell(2000, ['gridSpan' => 2])->addText("Actual PM", array_merge($fontStyle, ['bold' => true]), ['align' => 'center']);
        $table->addCell(2000, ['vMerge' => 'restart'])->addText("Total Hours", array_merge($fontStyle, ['bold' => true]));
        $table->addCell(2000, ['gridSpan' => 2])->addText("RTO", array_merge($fontStyle, ['bold' => true]), ['align' => 'center']);
        $table->addCell(2000, ['gridSpan' => 2])->addText("RAA", array_merge($fontStyle, ['bold' => true]), ['align' => 'center']);
        $table->addCell(2000, ['vMerge' => 'restart'])->addText("Adjusted PM Out", array_merge($fontStyle, ['bold' => true]));
        $table->addCell(2000, ['vMerge' => 'restart'])->addText("Total Adjusted Hours Rendered", array_merge($fontStyle, ['bold' => true]));

        // Second Header Row
        $table->addRow();
        $table->addCell(null, ['vMerge' => 'continue']);
        $table->addCell(null, ['vMerge' => 'continue']);
        $table->addCell()->addText("Time In", array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText("Time Out", array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText("Time In", array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText("Time Out", array_merge($fontStyle, ['bold' => true]));
        $table->addCell(null, ['vMerge' => 'continue']);
        $table->addCell()->addText("Date Submitted", array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText("Date Approved", array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText("Date Submitted", array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText("Date Approved", array_merge($fontStyle, ['bold' => true]));
        $table->addCell(null, ['vMerge' => 'continue']);
        $table->addCell(null, ['vMerge' => 'continue']);

        // Data Rows
        foreach ($timeRecords as $record) {
            $table->addRow();
            $table->addCell()->addText($record->division ?? '', $fontStyle);
            $table->addCell()->addText($record->name ?? '', $fontStyle);
            $table->addCell()->addText($record->am_time_in ?? '', $fontStyle);
            $table->addCell()->addText($record->am_time_out ?? '', $fontStyle);
            $table->addCell()->addText($record->pm_time_in ?? '', $fontStyle);
            $table->addCell()->addText($record->pm_time_out ?? '', $fontStyle);
            $table->addCell()->addText($record->total_hours ?? '', $fontStyle);
            $table->addCell()->addText($record->rto_date_submitted ?? '', $fontStyle);
            $table->addCell()->addText($record->rto_date_approved ?? '', $fontStyle);
            $table->addCell()->addText($record->raa_date_submitted ?? '', $fontStyle);
            $table->addCell()->addText($record->raa_date_approved ?? '', $fontStyle);
            $table->addCell()->addText('', $fontStyle);
            $table->addCell()->addText('', $fontStyle);
        }

        $section->addTextBreak(2);

        $phpWord->addTableStyle('SignatureTable', [
            'borderSize' => 0,
            'borderColor' => 'FFFFFF',
            'cellMargin' => 80
        ]);
        $signatureTable = $section->addTable('SignatureTable');

        $signatureTable->addRow();
        
        $createSignatureCell = function($table, $title, $name) {
            $cell = $table->addCell(3000);
            $textRun = $cell->addTextRun(['alignment' => 'left']);
            $textRun->addText($title);
            $cell->addTextBreak(2); 
            $textRun2 = $cell->addTextRun(['alignment' => 'left']);
            $textRun2->addText($name);
        };

        $createSignatureCell($signatureTable, "Record Rectified by:", "HRU Personnel");
        $createSignatureCell($signatureTable, "Certified Correct by:", "HRU PTL");
        $createSignatureCell($signatureTable, "Noted by:", "SuAO/CAO");

        // 🔹 Save & Download
        $fileName = "time_records_{$date}.docx";
        $tempFile = tempnam(sys_get_temp_dir(), 'word');
        $phpWord->save($tempFile, 'Word2007');

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }
}
