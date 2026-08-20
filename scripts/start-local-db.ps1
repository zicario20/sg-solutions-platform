param(
    [string]$ComposePath = "$PSScriptRoot\..\docker-compose.yml"
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

function Write-Status {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format HH:mm:ss)] $Message" -ForegroundColor Cyan
}

function Resolve-DockerExe {
    $dockerCmd = Get-Command docker.exe -ErrorAction SilentlyContinue
    if ($dockerCmd) { $dockerCmd = $dockerCmd.Source }

    $dockerAlias = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerAlias) { $dockerAlias = $dockerAlias.Source }

    $candidates = @(
        $dockerCmd,
        $dockerAlias,
        "${env:ProgramFiles}\Docker\Docker\resources\bin\docker.exe",
        "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
        "${env:LOCALAPPDATA}\Programs\Docker\Docker\Docker Desktop.exe"
    ) | Where-Object { $_ } | Select-Object -Unique

    foreach ($path in $candidates) {
        if ($path -and (Test-Path $path)) {
            return $path
        }
    }
    throw "No se encontró docker.exe. Instala Docker Desktop o agrega docker al PATH."
}

function Ensure-DockerRunning {
    param([string]$DockerBinary)

    Write-Status "Verificando estado inicial de Docker..."

    $dockerExe = $DockerBinary
    for ($i = 0; $i -lt 3; $i++) {
        & $dockerExe info > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Docker daemon ya está listo."
            return
        }
        Start-Sleep -Seconds 2
    }

    $desktop = Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue
    if (-not $desktop) {
        $desktopExe = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $desktopExe) {
            Write-Status "Iniciando Docker Desktop..."
            Start-Process -FilePath $desktopExe | Out-Null
        }
        else {
            throw "No se encontró Docker Desktop.exe para iniciar el daemon."
        }
    }

    for ($i = 0; $i -lt 30; $i++) {
        & $dockerExe info > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Docker daemon listo."
            return
        }
        if ($i -eq 0) {
            Write-Status "Esperando a Docker Engine..."
        }
        Start-Sleep -Seconds 2
    }

    throw "No fue posible conectar con el daemon de Docker. Revisa Docker Desktop y que WSL2 esté habilitado en Windows."
}

function Compose-Path-Validate {
    param([string]$Path)

    $resolved = Resolve-Path -Path $Path -ErrorAction SilentlyContinue
    if (-not $resolved -or -not (Test-Path $resolved)) {
        throw "No existe docker-compose.yml en: $resolved"
    }
    return $resolved.Path
}

Write-Status "--- Arranque local de Postgres para SG Solutions ---"
$dockerExe = Resolve-DockerExe
$composeFile = Compose-Path-Validate -Path $ComposePath
Write-Status "Usando docker en: $dockerExe"
Write-Status "Usando compose file: $composeFile"

Ensure-DockerRunning -DockerBinary $dockerExe

Write-Status "Levantando servicio postgres..."
Push-Location (Split-Path -Path $composeFile -Parent)
try {
    & $dockerExe compose -f $composeFile up -d postgres
    if ($LASTEXITCODE -ne 0) { throw "docker compose up -d postgres falló (code $LASTEXITCODE)." }

    & $dockerExe compose -f $composeFile ps
    Write-Status "Listo. DB local en: postgres://atlas:atlas_local_password@localhost:55432/atlas_test"
}
finally {
    Pop-Location
}
