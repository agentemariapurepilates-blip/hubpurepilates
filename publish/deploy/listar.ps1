# Lista os arquivos de uma pasta do servidor com o hash de cada um.
#
# E o que deixa o deploy-rapido.sh subir so o que mudou: ele compara esta
# lista com o build local e envia apenas os arquivos novos ou diferentes.
#
# O caminho sai em base64 (UTF-8) de proposito. O PowerShell 5.1 escreve na
# saida do ssh com a pagina de codigo do console, e nome com acento ("Arte
# pronta.jpeg", "Captura de Tela ... as ...") chegaria trocado do outro lado.
# Um nome trocado nunca bate com o local: o arquivo subiria de novo a cada
# deploy, e a limpeza tentaria apagar um nome que nao existe.
#
# Uma linha por arquivo: <caminho em base64><TAB><sha256>
# Se a pasta nao existe, ela e criada vazia: no primeiro deploy, tudo sobe.

param([Parameter(Mandatory = $true)][string]$Pasta)

$ErrorActionPreference = 'Stop'
$raiz = Join-Path (Get-Location) $Pasta
if (-not (Test-Path $raiz)) {
    New-Item -ItemType Directory -Path $raiz -Force | Out-Null
}
$raiz = (Resolve-Path $raiz).Path.TrimEnd('\')

Get-ChildItem -Path $raiz -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($raiz.Length + 1).Replace('\', '/')
    $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($rel))
    $hash = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash.ToLower()
    [Console]::Out.WriteLine("$b64`t$hash")
}
