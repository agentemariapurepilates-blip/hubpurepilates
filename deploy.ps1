# =============================================================================
# Hub Pure Pilates - Deploy Frontend para Produção (Windows)
# =============================================================================
# Uso (rodar no PowerShell):
#   .\deploy.ps1              -> build + deploy
#   .\deploy.ps1 -UploadOnly  -> apenas upload (sem rebuild)
#
# Requer: WinSCP instalado
# =============================================================================

param(
    [switch]$UploadOnly
)

$ErrorActionPreference = "Stop"

$winscp       = "$env:LOCALAPPDATA\Programs\WinSCP\WinSCP.com"
$host2        = "54.200.117.84"
$user         = "ftp_sistemas"
$pass         = "Xk9#mPv#2wLq!8Tz"
$remoteFront  = "/hub.purepilates.com.br/wwwroot"
$root         = $PSScriptRoot
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
#
# O index.html vai POR ÚLTIMO, e essa ordem é a coisa mais importante daqui.
#
# Ele é o mapa: aponta para os .js pelo nome, e cada build gera nomes novos
# (index-DqLDq07S.js). O `synchronize` sozinho enviava a raiz antes das
# subpastas, então o mapa novo chegava primeiro e o servidor passava a
# entregá-lo apontando para 12 MB de arquivos que ainda estavam subindo. A
# ~40 KB/s medidos, isso é uma janela de CINCO MINUTOS em que quem abrisse o
# Hub pedia um .js que não existia, tomava 404 e via tela branca. Em 25/08/2026
# isso derrubou o Hub três vezes, e o diagnóstico demorou porque o problema
# some sozinho quando o upload termina.
#
# Invertendo, durante o upload o servidor continua servindo o mapa ANTIGO — e
# os arquivos antigos continuam lá, porque `synchronize` não apaga nada. O Hub
# fica de pé o tempo todo, e no instante em que o index.html novo sobe, tudo
# que ele referencia já chegou. Janela de risco: zero.
#
# `-filemask="|index.html"` exclui o arquivo da sincronização (a barra vertical
# separa o que entra do que fica de fora). Existe um único index.html no dist,
# na raiz — se algum dia houver outro aninhado, este filtro pega os dois e a
# regra precisa virar um caminho explícito.
Write-Host "[2/2] Enviando frontend (arquivos primeiro, index.html por último)..." -ForegroundColor Cyan

Upload-Via-WinSCP @"
open sftp://${user}:${pass}@${host2}/ -hostkey=*
option batch abort
option confirm off
synchronize remote -filemask="|index.html" "$frontDist" "$remoteFront"
exit
"@

Write-Host "      Arquivos enviados. Publicando o index.html..." -ForegroundColor Green

Upload-Via-WinSCP @"
open sftp://${user}:${pass}@${host2}/ -hostkey=*
option batch abort
option confirm off
put "$frontDist\index.html" "$remoteFront/"
exit
"@

Write-Host "      Frontend enviado." -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Frontend: https://hub.purepilates.com.br/" -ForegroundColor White
Write-Host ""
