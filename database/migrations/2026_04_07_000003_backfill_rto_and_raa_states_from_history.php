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
        $this->backfillRtoStates();
        $this->backfillRaaStates();
    }

    public function down(): void
    {
        // Intentionally left blank. This migration only synchronizes legacy rows
        // with their latest submission history.
    }

    private function backfillRtoStates(): void
    {
        $conn = DB::connection('mysql2');

        $rows = $conn->table('flexi_rto')
            ->select('id', 'rto_state')
            ->orderBy('id')
            ->get();

        foreach ($rows as $row) {
            $latestStatus = $conn->table('submission_history')
                ->where('model', 'RTO')
                ->where('model_id', $row->id)
                ->orderByDesc('id')
                ->value('status');

            if (! $latestStatus) {
                continue;
            }

            $targetState = $this->mapRtoStatusToState($latestStatus);

            if (! $targetState) {
                continue;
            }

            if ($row->rto_state !== $targetState) {
                $conn->table('flexi_rto')
                    ->where('id', $row->id)
                    ->update(['rto_state' => $targetState]);
            }
        }
    }

    private function backfillRaaStates(): void
    {
        $conn = DB::connection('mysql2');

        $rows = $conn->table('flexi_raa')
            ->select('id', 'raa_state')
            ->orderBy('id')
            ->get();

        foreach ($rows as $row) {
            $latestStatus = $conn->table('submission_history')
                ->where('model', 'RAA')
                ->where('model_id', $row->id)
                ->orderByDesc('id')
                ->value('status');

            if (! $latestStatus) {
                continue;
            }

            $targetState = $this->mapRaaStatusToState($latestStatus);

            if (! $targetState) {
                continue;
            }

            if ($row->raa_state !== $targetState) {
                $conn->table('flexi_raa')
                    ->where('id', $row->id)
                    ->update(['raa_state' => $targetState]);
            }
        }
    }

    private function mapRtoStatusToState(string $status): ?string
    {
        return match ($status) {
            'Draft' => RtoDraft::class,
            'Submitted' => RtoSubmitted::class,
            'Endorsed' => RtoEndorsed::class,
            'Approved' => RtoApproved::class,
            'Disapproved' => RtoDisapproved::class,
            'Returned', 'Needs Revision' => RtoReturned::class,
            'Resubmitted' => RtoResubmitted::class,
            default => null,
        };
    }

    private function mapRaaStatusToState(string $status): ?string
    {
        return match ($status) {
            'Draft' => RaaDraft::class,
            'Submitted' => RaaSubmitted::class,
            'Endorsed' => RaaEndorsed::class,
            'Approved' => RaaApproved::class,
            'Disapproved' => RaaDisapproved::class,
            'Returned', 'Needs Revision' => RaaReturned::class,
            'Resubmitted' => RaaResubmitted::class,
            default => null,
        };
    }
};
