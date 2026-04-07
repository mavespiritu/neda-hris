<?php

namespace App\States\Rto\Transitions;

use App\Models\Rto;
use Illuminate\Support\Facades\DB;

trait LogsRtoHistory
{
    protected function logHistory(
        int $rtoId,
        string $status,
        string $actedBy,
        ?string $remarks = null
    ): void {
        DB::connection('mysql2')
            ->table('submission_history')
            ->insert([
                'model' => 'RTO',
                'model_id' => $rtoId,
                'status' => $status,
                'acted_by' => $actedBy,
                'date_acted' => now(),
                'remarks' => $remarks,
            ]);
    }

    protected function saveState(
        Rto $rto,
        string $status,
        string $actedBy,
        ?string $remarks = null
    ): void {
        $this->logHistory((int) $rto->id, $status, $actedBy, $remarks);
    }
}
