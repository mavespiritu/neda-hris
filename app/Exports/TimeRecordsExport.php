<?php

namespace App\Exports;

use Illuminate\Contracts\Support\Responsable;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;

class TimeRecordsExport implements FromCollection, WithHeadings, WithEvents
{
    protected $date;

    public function __construct($date)
    {
        $this->date = $date ? Carbon::parse($date)->format('Y-m-d') : Carbon::today()->format('Y-m-d');
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        $conn3 = DB::connection('mysql3');

        $fullName = DB::raw("
            CONCAT(
                e.lname, ', ',
                e.fname, ' ',
                IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '.'), '')
            ) AS name
        ");

        return $conn3->table('tblactual_dtr as d')
            ->select(
                'e.division_id as division',
                $fullName,
                DB::raw("MAX(CASE WHEN d.time = 'AM' THEN TIME(d.time_in) END) as am_time_in"),
                DB::raw("MAX(CASE WHEN d.time = 'AM' THEN TIME(d.time_out) END) as am_time_out"),
                DB::raw("MAX(CASE WHEN d.time = 'PM' THEN TIME(d.time_in) END) as pm_time_in"),
                DB::raw("MAX(CASE WHEN d.time = 'PM' THEN TIME(d.time_out) END) as pm_time_out"),
                DB::raw("
                    (
                        SUM(
                            GREATEST(
                                0,
                                TIMESTAMPDIFF(
                                    SECOND,
                                    d.time_in,
                                    d.time_out
                                )
                            )
                        )
                        - 3600
                    ) / 3600 as total_hours
                ")
            )
            ->leftJoin('tblemployee as e', 'e.emp_id', '=', 'd.emp_id')
            ->join('tblemp_dtr_type as dt', function ($join) {
                $join->on('dt.emp_id', '=', 'd.emp_id')
                    ->on('dt.date', '=', 'd.date');
            })
            ->where('dt.dtr_id', 'FLEXIPLACE')
            ->whereDate('d.date', $this->date)
            ->groupBy('d.emp_id', 'd.date')
            ->orderBy('e.division_id')
            ->orderBy('e.lname')
            ->orderBy('e.fname')
            ->orderBy('e.mname')
            ->get();
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
