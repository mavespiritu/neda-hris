<?php

namespace App\Exports;

use Illuminate\Contracts\Support\Responsable;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use App\Traits\FetchFlexiplaceRecords;

class TimeRecordsExport implements FromCollection, WithHeadings, WithEvents
{
    protected $date;
    use FetchFlexiplaceRecords;


    public function __construct($date)
    {
        $this->date = $date;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        return $this->fetchFlexiplaceRecords($this->date);
    }

    public function headings(): array
    {
        return [
            'Division',
            'Name',
            'AM Time In',
            'AM Time Out',
            'PM Time In',
            'PM Time Out',
            'Total Hours',
            'RTO Submitted',
            'RTO Approved',
            'RAA Submitted',
            'RAA Approved',
            'Adjusted PM Out'
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;

                $sheet->insertNewRowBefore(1, 2);

                $event->sheet->setCellValue('A1', 'Flexiplace Date');
                $event->sheet->setCellValue('B1', $this->date);

                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 12],
                ]);
            },
        ];
    }
}
