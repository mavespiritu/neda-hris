<?php

namespace App\Services\Publications;

use Illuminate\Database\ConnectionInterface;

class PublicationFormBuilder
{
    public function build(ConnectionInterface $connection, ?int $id = null): array
    {
        $publication = [
            'id' => null,
            'reference_no' => '',
            'date_published' => '',
            'date_closed' => '',
            'is_public' => 0,
            'files' => [],
            'newFiles' => [],
            'removeFiles' => [],
        ];

        if (! $id) {
            return $publication;
        }

        $record = $connection->table('publication')->where('id', $id)->first();

        if (! $record) {
            abort(404, 'Page not found.');
        }

        $files = $connection->table('file')
            ->where('model', 'Publication')
            ->where('itemId', $id)
            ->select(['id', 'itemId', 'name', 'path', 'size', 'mime'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(fn ($file) => (array) $file)
            ->all();

        return array_merge($publication, (array) $record, [
            'files' => $files,
            'newFiles' => [],
            'removeFiles' => [],
        ]);
    }
}
