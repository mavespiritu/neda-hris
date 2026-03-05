<?php

namespace App\Support;

use Carbon\Carbon;

class DateRange
{
    public static function display($start, $end): string
    {
        if (empty($start) || empty($end)) {
            return '';
        }

        try {
            $s = Carbon::parse($start);
            $e = Carbon::parse($end);
        } catch (\Throwable $e) {
            return '';
        }

        if ($s->isSameDay($e)) {
            return $s->format('F j, Y');
        }

        if ($s->year !== $e->year) {
            return $s->format('F j, Y') . ' - ' . $e->format('F j, Y');
        }

        if ($s->month !== $e->month) {
            return $s->format('F j') . ' - ' . $e->format('F j, Y');
        }

        return $s->format('F j') . ' - ' . $e->format('j, Y');
    }
}
