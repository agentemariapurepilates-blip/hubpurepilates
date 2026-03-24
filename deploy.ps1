# =============================================================================
# Hub Pure Pilates - Deploy Frontend para Produção (Windows)
# =============================================================================
# Uso (rodar no PowerShell):
#   .\deploy.ps1              -> build + deploy
#   .\deploy.ps1 -UploadOnly  -> apenas upload (sem rebuild)
#
# Requer: WinSCP instalado
# Requer: .env.deploy na raiz do projeto com as credenciais
# =============================================================================

param(
    [switch]$UploadOnly
)

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$envFile = "$root\.env.deploy"

# Carregar credenciais
if (-not (Test-Path $envFile)) {
    Write-Host "ERRO: Arquivo .env.deploy não encontrado!" -ForegroundColor Red
    Write-Host "Crie o arquivo .env.deploy na raiz do projeto com:"
    Write-Host "  DEPLOY_HOST=seu.servidor.ip"
    Write-Host "  DEPLOY_USER=seu_usuario"
    Write-Host "  DEPLOY_PASS=sua_senha"
    Write-Host "  DEPLOY_REMOTE_PATH=/caminho/remoto"
    exit 1
}

$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.+)$") {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$winscp       = "$env:LOCALAPPDATA\Programs\WinSCP\WinSCP.com"
$host2        = $envVars["DEPLOY_HOST"]
$user         = $envVars["DEPLOY_USER"]
$pass         = $envVars["DEPLOY_PASS"]
$remoteFront  = $envVars["DEPLOY_REMOTE_PATH"]
$frontDist    = "$root\dist"
$webConfigSrc = "$root\publish\root-web.config"

function Upload-Via-WinSCP($script) {
    $tmp = "$env:TEMP\winscp_deploy_$([System.IO.Path]::GetRandomFileName()).txt"
    $script | Out-File -FilePath $tmp -Encoding ASCII
    & $winscp /ini=nul /script=$tmp
    $exit = $LASTEXITCODE
    Remove-Item $tmp -ErrorAction SilentlyContinue
    if ($exit -ne 0) { throw "WinSCP saiu com código $exit" }
}

# — Build frontend ————————————————————————————————————————————
if (-not $UploadOnly) {
    Write-Host "[1/2] Compilando frontend (Production)..." -ForegroundColor Cyan
    Set-Location $root
    & npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependências" }
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "Falha ao compilar frontend" }
    if (Test-Path $webConfigSrc) {
        Copy-Item $webConfigSrc "$frontDist\web.config" -Force
    }
    Write-Host "      Frontend OK." -ForegroundColor Green
}

Set-Location $root

# — Deploy Frontend ———————————————————————————————————————————
Write-Host "[2/2] Enviando frontend..." -ForegroundColor Cyan

Upload-Via-WinSCP @"
open sftp://${user}:${pass}@${host2}/ -hostkey=*
option batch abort
option confirm off
synchronize remote "$frontDist" "$remoteFront"
exit
"@

Write-Host "      Frontend enviado." -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Frontend: https://hub.purepilates.com.br/" -ForegroundColor White
Write-Host ""
