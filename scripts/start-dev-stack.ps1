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

$redisCmd = Get-Command redis-server -ErrorAction SilentlyContinue
$redisServer = Resolve-CommandPath @(
    $(if ($redisCmd) { $redisCmd.Source } else { $null }),
    'C:\laragon\bin\redis\redis-x64-5.0.14\redis-server.exe',
    'C:\Program Files\Redis\redis-server.exe',
    'C:\Program Files\Redis\redis-server'
)

if ($redisServer) {
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
