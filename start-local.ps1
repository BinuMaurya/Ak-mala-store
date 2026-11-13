$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSCommandPath
$port = 4175
$logDirectory = Join-Path $env:LOCALAPPDATA 'AK-Mala'
$logPath = Join-Path $logDirectory 'server.log'

try {
  $status = Invoke-RestMethod -Uri "http://localhost:$port/api/plugins/status" -TimeoutSec 2
  if ($null -ne $status.PSObject.Properties['gemini']) {
    Write-Output "AK MALA is already running at http://localhost:$port"
    exit 0
  }
} catch [System.Net.WebException] {
  if ($_.Exception.Status -notin @(
      [System.Net.WebExceptionStatus]::ConnectFailure,
      [System.Net.WebExceptionStatus]::NameResolutionFailure,
      [System.Net.WebExceptionStatus]::Timeout
    )) {
    throw
  }
}

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Set-Location $projectRoot
$env:PORT = [string]$port
$env:NODE_ENV = 'production'

$ErrorActionPreference = 'Continue'
& npm.cmd run build *>> $logPath
$buildExitCode = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($buildExitCode -ne 0) {
  throw "AK MALA production build failed. Check the log at $logPath"
}

$ErrorActionPreference = 'Continue'
& npm.cmd run start *>> $logPath
$serverExitCode = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($serverExitCode -ne 0) {
  throw "AK MALA stopped unexpectedly. Check the log at $logPath"
}
