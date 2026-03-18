<?php

namespace App\Services\Psgc;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class PsgcClient
{
    protected string $baseUrl = 'https://psgc.gitlab.io/api';

    public function get(string $path): array
    {
        $response = Http::timeout(15)
            ->get($this->baseUrl . $path);

        if (! $response->successful()) {
            throw new RuntimeException('Failed to fetch PSGC data.');
        }

        return $response->json();
    }
}
