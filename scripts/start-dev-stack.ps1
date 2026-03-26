param()

$ErrorActionPreference = 'Stop'

function Resolve-CommandPath {
    param(
        [string[]]$Candidates
    )

    foreach ($candidate in $Candidates) {
        if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
        if (Test-Path $candidate) { return $candidate }
    }

    return $null
}

function Resolve-RedisServerPath {
    $redisCmd = Get-Command redis-server -ErrorAction SilentlyContinue
    if ($redisCmd -and $redisCmd.Source -and (Test-Path $redisCmd.Source)) {
        return $redisCmd.Source
    }

    $knownPaths = @(
        'C:\laragon\bin\redis\redis-x64-5.0.14.1\redis-server.exe',
        'C:\laragon\bin\redis\redis-x64-5.0.14.0\redis-server.exe',
        'C:\laragon\bin\redis\redis-x64-5.0.14\redis-server.exe',
        'C:\Program Files\Redis\redis-server.exe',
        'C:\Program Files\Redis\redis-server'
    )

    $resolved = Resolve-CommandPath $knownPaths
    if ($resolved) {
        return $resolved
    }

    $laragonRedisRoot = 'C:\laragon\bin\redis'
    if (Test-Path $laragonRedisRoot) {
        $found = Get-ChildItem -Path $laragonRedisRoot -Recurse -Filter redis-server.exe -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty FullName

        if ($found) {
            return $found
        }
    }

    return $null
}

function Test-RedisAlreadyRunning {
    $redisProcess = Get-Process redis-server -ErrorAction SilentlyContinue
    if ($redisProcess) {
        return $true
    }

    try {
        $connection = Get-NetTCPConnection -LocalPort 6379 -State Listen -ErrorAction Stop
        return [bool] $connection
    } catch {
        return $false
    }
}

function Start-CommandWindow {
    param(
        [string]$Title,
        [string]$Command
    )

    $powershell = Join-Path $PSHOME 'powershell.exe'
    Start-Process -FilePath $powershell -WorkingDirectory (Get-Location) -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy', 'Bypass',
        '-Command', $Command
    ) -WindowStyle Normal | Out-Null
}

$redisServer = Resolve-RedisServerPath
$redisRunning = Test-RedisAlreadyRunning

if ($redisRunning) {
    Write-Host 'Redis is already running. Skipping Redis startup.' -ForegroundColor Green
} elseif ($redisServer) {
    Start-CommandWindow -Title 'Redis' -Command "`"$redisServer`""
} else {
    Write-Host 'Redis server not found. Install Redis or add redis-server.exe to PATH before starting Messenger.' -ForegroundColor Yellow
}

Start-CommandWindow -Title 'Laravel' -Command 'php artisan serve'
Start-CommandWindow -Title 'Vite' -Command 'npm run dev'
Start-CommandWindow -Title 'Reverb' -Command 'php artisan reverb:start'
Start-CommandWindow -Title 'Queue Worker' -Command 'php artisan queue:work'
Start-CommandWindow -Title 'Messenger Queue' -Command 'php artisan queue:work redis --queue=messenger --sleep=1 --tries=3'

Write-Host 'All app processes started in separate windows.' -ForegroundColor Green
