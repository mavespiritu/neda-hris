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

        $date = $this->date;

        return $conn3->table('tblemployee as e')
            ->select(
                'e.division_id as division',
                DB::raw("CONCAT(e.lname, ', ', e.fname, ' ', IF(e.mname IS NOT NULL AND e.mname != '', CONCAT(LEFT(e.mname, 1), '.'), '')) as name"),
                DB::raw('TIME(am.time_in) as am_time_in'),
                DB::raw('TIME(am.time_out) as am_time_out'),
                DB::raw('TIME(pm.time_in) as pm_time_in'),
                DB::raw('TIME(pm.time_out) as pm_time_out'),
                DB::raw("
                    SEC_TO_TIME(
                        GREATEST(
                            0,
                            TIMESTAMPDIFF(
                                SECOND,
                                am.time_in,
                                CASE WHEN TIME(am.time_out) > '12:00:00' THEN CONCAT(DATE(am.time_out),' 12:00:00') ELSE am.time_out END
                            )
                            +
                            TIMESTAMPDIFF(
                                SECOND,
                                CASE WHEN TIME(pm.time_in) < '13:00:00' THEN CONCAT(DATE(pm.time_in),' 13:00:00') ELSE pm.time_in END,
                                pm.time_out
                            )
                        )
                    ) AS total_hours
                ")
            )
            ->leftJoinSub(function($query) use ($date) {
                $query->from('tblactual_dtr')
                    ->select(
                        'emp_id', 
                        'time_in', 
                        'time_out'
                    )
                    ->where('time', 'AM')
                    ->whereDate('date', $date);
            }, 'am', function($join){
                $join->on('am.emp_id', '=', 'e.emp_id');
            })
            ->leftJoinSub(function($query) use ($date) {
                $query->from('tblactual_dtr')
                    ->select(
                        'emp_id', 
                        'time_in', 
                        'time_out'
                    )
                    ->where('time', 'PM')
                    ->whereDate('date', $date);
            }, 'pm', function($join){
                $join->on('pm.emp_id', '=', 'e.emp_id');
            })
            ->where('e.work_status', 'active')
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
