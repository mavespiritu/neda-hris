<?php

namespace App\Notifications\Concerns;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

trait BuildsRaaEmailPayload
{
    protected function buildRaaOutputs(int $rtoId): Collection
    {
        $conn2 = DB::connection('mysql2');

        $outputs = $conn2->table('flexi_target')
            ->where('rto_id', $rtoId)
            ->select('id', 'output')
            ->get();

        $outputIds = $outputs->pluck('id')->all();

        $accomplishments = $conn2->table('flexi_accomplishment')
            ->whereIn('target_id', $outputIds)
            ->select('id', 'accomplishment', 'remarks', 'rto_id', 'raa_id', 'target_id')
            ->get();

        $files = $conn2->table('file')
            ->where('model', 'RAA')
            ->whereIn('itemId', $accomplishments->pluck('id')->all())
            ->select('id', 'itemId', 'path', 'name', 'mime')
            ->get()
            ->groupBy('itemId');

        $accomplishmentsByTarget = $accomplishments->groupBy('target_id');

        foreach ($outputs as $output) {
            $accs = $accomplishmentsByTarget->get($output->id, collect())->values()->map(function ($accomplishment) use ($files) {
                $accomplishmentFiles = $files->get($accomplishment->id, collect())->map(function ($file) {
                    $disk = null;
                    $inlineSrc = null;
                    $isImage = false;

                    if (Storage::disk('private')->exists($file->path)) {
                        $disk = 'private';
                    } elseif (Storage::disk('public')->exists($file->path)) {
                        $disk = 'public';
                    }

                    $mime = $file->mime ?: ($disk ? Storage::disk($disk)->mimeType($file->path) : null);
                    $isImage = $mime ? str_starts_with($mime, 'image/') : false;

                    if ($disk && $isImage) {
                        $contents = Storage::disk($disk)->get($file->path);
                        $inlineSrc = 'data:' . $mime . ';base64,' . base64_encode($contents);
                    }

                    return [
                        'id' => $file->id,
                        'name' => $file->name,
                        'mime' => $mime,
                        'url' => route('files.download', $file->id),
                        'is_image' => $isImage,
                        'inline_src' => $inlineSrc,
                    ];
                })->values();

                $accomplishment->files = $accomplishmentFiles;

                return $accomplishment;
            });

            $output->accomplishments = $accs;
        }

        return $outputs;
    }

    protected function formatEmployeeName(?string $fname, ?string $mname, ?string $lname): string
    {
        $first = trim((string) $fname);
        $middle = trim((string) $mname);
        $last = trim((string) $lname);

        $parts = [];

        if ($first !== '') {
            $parts[] = $first;
        }

        if ($middle !== '') {
            $parts[] = strtoupper(substr($middle, 0, 1)) . '.';
        }

        if ($last !== '') {
            $parts[] = $last;
        }

        return trim(preg_replace('/\s+/', ' ', implode(' ', $parts)));
    }
}
