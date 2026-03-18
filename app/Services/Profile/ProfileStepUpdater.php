<?php

namespace App\Services\Profile;

use Illuminate\Database\ConnectionInterface;

class ProfileStepUpdater
{
    public function markComplete(ConnectionInterface $connection, int $applicantId, string $step): void
    {
        $connection->table('applicant_pds')->updateOrInsert(
            [
                'applicant_id' => $applicantId,
                'step' => $step,
            ],
            [
                'status' => 1,
            ]
        );
    }
}
