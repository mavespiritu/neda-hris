<?php

namespace App\States\VehicleRequest\Transitions;

use Illuminate\Support\Facades\DB;

trait LogsTravelRequestHistory
{
  protected function logHistory($travelRequestId, string $status, string $actedBy, ?string $remarks = null): void
  {
    $conn2 = DB::connection('mysql2');

    $conn2->table('submission_history')->insert([
      'model' => 'TO',
      'model_id' => $travelRequestId,
      'status' => $status,
      'acted_by' => $actedBy,
      'date_acted' => now(),
      'remarks' => $remarks,
    ]);
  }
}
