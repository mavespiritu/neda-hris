<?php

namespace App\Actions\Flexiplace;

use App\Traits\FetchFlexiplaceRecords;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Lorisleiva\Actions\Concerns\AsAction;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Style\Section;

class ExportWordTimeRecords
{
    use AsAction;
    use FetchFlexiplaceRecords;

    public function authorize(Request $request): bool
    {
        return $request->user() !== null
            && Gate::forUser($request->user())->allows('export', 'flexiplace.reports');
    }

    public function asController(Request $request)
    {
        $date = $request->input('date')
            ? Carbon::parse($request->input('date'))->format('Y-m-d')
            : Carbon::today()->format('Y-m-d');

        $timeRecords = $this->fetchFlexiplaceRecords($date);

        $phpWord = new PhpWord();
        $section = $phpWord->addSection([
            'orientation' => Section::ORIENTATION_LANDSCAPE,
        ]);
        $section->addText("Date of Flexiplace: {$date}", ['size' => 12]);

        $tableStyle = [
            'borderSize' => 6,
            'borderColor' => '000000',
            'cellMargin' => 80,
        ];

        $phpWord->addTableStyle('TimeRecordsTable', $tableStyle);
        $table = $section->addTable('TimeRecordsTable');
        $fontStyle = ['size' => 9];

        $table->addRow();
        $table->addCell(2000, ['vMerge' => 'restart'])->addText('Division', array_merge($fontStyle, ['bold' => true]));
        $table->addCell(3000, ['vMerge' => 'restart'])->addText('Name', array_merge($fontStyle, ['bold' => true]));
        $table->addCell(2000, ['gridSpan' => 2])->addText('Actual AM', array_merge($fontStyle, ['bold' => true]), ['align' => 'center']);
        $table->addCell(2000, ['gridSpan' => 2])->addText('Actual PM', array_merge($fontStyle, ['bold' => true]), ['align' => 'center']);
        $table->addCell(2000, ['vMerge' => 'restart'])->addText('Total Hours', array_merge($fontStyle, ['bold' => true]));
        $table->addCell(2000, ['gridSpan' => 2])->addText('RTO', array_merge($fontStyle, ['bold' => true]), ['align' => 'center']);
        $table->addCell(2000, ['gridSpan' => 2])->addText('RAA', array_merge($fontStyle, ['bold' => true]), ['align' => 'center']);
        $table->addCell(2000, ['vMerge' => 'restart'])->addText('Adjusted PM Out', array_merge($fontStyle, ['bold' => true]));
        $table->addCell(2000, ['vMerge' => 'restart'])->addText('Total Adjusted Hours Rendered', array_merge($fontStyle, ['bold' => true]));

        $table->addRow();
        $table->addCell(null, ['vMerge' => 'continue']);
        $table->addCell(null, ['vMerge' => 'continue']);
        $table->addCell()->addText('Time In', array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText('Time Out', array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText('Time In', array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText('Time Out', array_merge($fontStyle, ['bold' => true]));
        $table->addCell(null, ['vMerge' => 'continue']);
        $table->addCell()->addText('Date Submitted', array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText('Date Approved', array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText('Date Submitted', array_merge($fontStyle, ['bold' => true]));
        $table->addCell()->addText('Date Approved', array_merge($fontStyle, ['bold' => true]));
        $table->addCell(null, ['vMerge' => 'continue']);
        $table->addCell(null, ['vMerge' => 'continue']);

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
            $table->addCell()->addText($record->recommended_pm_time_out ?? '', $fontStyle);
            $table->addCell()->addText('', $fontStyle);
        }

        $section->addTextBreak(2);

        $phpWord->addTableStyle('SignatureTable', [
            'borderSize' => 0,
            'borderColor' => 'FFFFFF',
            'cellMargin' => 80,
        ]);
        $signatureTable = $section->addTable('SignatureTable');
        $signatureTable->addRow();

        $createSignatureCell = function ($table, $title, $name) {
            $cell = $table->addCell(3000);
            $textRun = $cell->addTextRun(['alignment' => 'left']);
            $textRun->addText($title);
            $cell->addTextBreak(2);
            $textRun2 = $cell->addTextRun(['alignment' => 'left']);
            $textRun2->addText($name);
        };

        $createSignatureCell($signatureTable, 'Record Rectified by:', 'HRU Personnel');
        $createSignatureCell($signatureTable, 'Certified Correct by:', 'HRU PTL');
        $createSignatureCell($signatureTable, 'Noted by:', 'SuAO/CAO');

        $fileName = "time_records_{$date}.docx";
        $tempFile = tempnam(sys_get_temp_dir(), 'word');
        $phpWord->save($tempFile, 'Word2007');

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }
}
