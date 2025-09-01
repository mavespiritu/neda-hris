<?php

namespace App\Traits;

trait HasFileUrl
{
    public function resolveFileUrl(
        $originalFilePath,
        $oldRootPath = 'D:/wamp/www/npis/',
        $baseUrls = [
            'http://58.69.112.182/NPIS/',
            'http://58.69.112.182:81/IPMS/',
        ],
        $targetDir = 'uploads/applicant/education/'
    ) {
        if (!$originalFilePath) {
            return null;
        }

        // normalize windows paths to forward slashes
        $originalFilePath = str_replace('\\', '/', $originalFilePath);
        $oldRootPath = str_replace('\\', '/', $oldRootPath);

        // derive relative path
        $relativePath = str_replace($oldRootPath, '', $originalFilePath);
        $relativePath = ltrim($relativePath, '/');

        // build local path
        $filename = basename($relativePath);
        $localPath = public_path($targetDir . $filename);
        $localUrl  = asset($targetDir . $filename);

        // if already exists in Laravel public
        if (file_exists($localPath)) {
            return $localUrl;
        }

        // else try downloading from each old base URL
        foreach ($baseUrls as $baseUrl) {
            $oldFileUrl = rtrim($baseUrl, '/') . '/' . $relativePath;

            if ($this->downloadFromUrl($oldFileUrl, $localPath)) {
                return $localUrl;
            }
        }

        // if unable to download, just return the first base URL fallback
        return rtrim($baseUrls[0], '/') . '/' . $relativePath;
    }

    protected function downloadFromUrl($url, $destination)
    {
        try {
            $dir = dirname($destination);
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }

            $fileContents = @file_get_contents($url);

            if ($fileContents === false) {
                return false;
            }

            file_put_contents($destination, $fileContents);
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to download file from URL: $url. Error: ".$e->getMessage());
            return false;
        }
    }
}
