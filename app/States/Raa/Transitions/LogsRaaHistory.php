<?php

namespace App\States\Raa\Transitions;

use App\Models\Raa;
use Illuminate\Support\Facades\DB;

trait LogsRaaHistory
{
    protected function logHistory(
        int $raaId,
        string $status,
        string $actedBy,
        ?string $remarks = null
    ): void {
        DB::connection('mysql2')
            ->table('submission_history')
            ->insert([
                'model' => 'RAA',
                'model_id' => $raaId,
                'status' => $status,
                'acted_by' => $actedBy,
                'date_acted' => now(),
                'remarks' => $remarks,
            ]);
    }

    protected function saveState(
        Raa $raa,
        string $status,
        string $actedBy,
        ?string $remarks = null
    ): void {
        $this->logHistory((int) $raa->id, $status, $actedBy, $remarks);
    }
}
