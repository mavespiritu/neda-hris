<?php

use App\States\Raa\Approved as RaaApproved;
use App\States\Raa\Disapproved as RaaDisapproved;
use App\States\Raa\Draft as RaaDraft;
use App\States\Raa\Endorsed as RaaEndorsed;
use App\States\Raa\Resubmitted as RaaResubmitted;
use App\States\Raa\Returned as RaaReturned;
use App\States\Raa\Submitted as RaaSubmitted;
use App\States\Rto\Approved as RtoApproved;
use App\States\Rto\Disapproved as RtoDisapproved;
use App\States\Rto\Draft as RtoDraft;
use App\States\Rto\Endorsed as RtoEndorsed;
use App\States\Rto\Resubmitted as RtoResubmitted;
use App\States\Rto\Returned as RtoReturned;
use App\States\Rto\Submitted as RtoSubmitted;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $conn = DB::connection('mysql2');

        $this->backfillTable($conn, 'flexi_rto', 'RTO', 'rto_state', [
            'Draft' => RtoDraft::class,
            'Submitted' => RtoSubmitted::class,
            'Endorsed' => RtoEndorsed::class,
            'Approved' => RtoApproved::class,
            'Disapproved' => RtoDisapproved::class,
            'Returned' => RtoReturned::class,
            'Needs Revision' => RtoReturned::class,
            'Resubmitted' => RtoResubmitted::class,
        ]);

        $this->backfillTable($conn, 'flexi_raa', 'RAA', 'raa_state', [
            'Draft' => RaaDraft::class,
            'Submitted' => RaaSubmitted::class,
            'Endorsed' => RaaEndorsed::class,
            'Approved' => RaaApproved::class,
            'Disapproved' => RaaDisapproved::class,
            'Returned' => RaaReturned::class,
            'Needs Revision' => RaaReturned::class,
            'Resubmitted' => RaaResubmitted::class,
        ]);
    }

    public function down(): void
    {
        // No rollback data restoration for legacy state synchronization.
    }

    private function backfillTable($conn, string $table, string $model, string $stateColumn, array $map): void
    {
        $rows = $conn->table($table)
            ->select('id', $stateColumn)
            ->orderBy('id')
            ->get();

        foreach ($rows as $row) {
            $latestStatus = $conn->table('submission_history')
                ->where('model', $model)
                ->where('model_id', $row->id)
                ->orderByDesc('id')
                ->value('status');

            if (! $latestStatus || ! isset($map[$latestStatus])) {
                continue;
            }

            $targetState = $map[$latestStatus];

            if ($row->{$stateColumn} !== $targetState) {
                $conn->table($table)
                    ->where('id', $row->id)
                    ->update([$stateColumn => $targetState]);
            }
        }
    }
};
