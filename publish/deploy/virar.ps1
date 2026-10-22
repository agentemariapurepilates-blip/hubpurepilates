# A virada: copia uma versao pronta para o site, sem tirar o site do ar.
#
# Usado pelo deploy-rapido.sh de dois jeitos:
#   deploy:  -Origem deploy-staging  -Backup deploy-anterior
#   voltar:  -Origem deploy-anterior (sem -Backup)
#
# POR QUE NESTA ORDEM. O deploy.sh antigo apaga o site e depois sobe tudo: do
# primeiro ao ultimo arquivo, nao ha site (10 a 55 minutos de 403). Aqui o site
# nunca fica vazio:
#   1. guarda o site atual em -Backup (e o que permite voltar em segundos);
#   2. copia o codigo novo AO LADO do antigo. Os arquivos de codigo tem hash
#      no nome, entao novo e antigo convivem: quem esta com a pagina aberta
#      continua carregando os pedacos da versao dele;
#   3. por ultimo, web.config e index.html. E o index.html que aponta para o
#      codigo novo: trocado ele, a versao nova esta no ar. E um arquivo de 2 KB,
#      copiado de disco para disco - a janela e de milissegundos;
#   4. limpa o que nao existe mais na versao nova. Codigo (app\) com menos de
#      -ManterDias dias fica: uma aba aberta antes do deploy ainda pode pedir
#      esses pedacos, e apagar faria a tela dela quebrar no meio do uso.
#
# Tudo e robocopy, que vem no Windows. Copia de disco para disco: segundos.

param(
    [Parameter(Mandatory = $true)][string]$Origem,
    [Parameter(Mandatory = $true)][string]$Site,
    [string]$Backup = '',
    [int]$ManterDias = 7
)

$ErrorActionPreference = 'Stop'
$base = (Get-Location).Path
$or = Join-Path $base $Origem
$si = Join-Path $base $Site

function Copiar([string]$de, [string]$para, [string[]]$extra) {
    & robocopy $de $para @extra /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
    # robocopy: 0 a 7 e sucesso (com ou sem arquivos copiados); 8 ou mais e falha.
    if ($LASTEXITCODE -ge 8) { throw "robocopy falhou (codigo $LASTEXITCODE): $de -> $para" }
}

# Uma origem sem index.html ou sem web.config publicaria um site quebrado:
# melhor parar antes de tocar em qualquer coisa.
foreach ($f in 'index.html', 'web.config') {
    if (-not (Test-Path -LiteralPath (Join-Path $or $f))) { throw "a origem nao tem $f - nada foi alterado" }
}

if ($Backup) {
    Copiar $si (Join-Path $base $Backup) @('/MIR')
    [Console]::Out.WriteLine('BACKUP OK')
}

# /XF com o caminho COMPLETO: so exclui o index.html e o web.config da raiz.
# Pelo nome, excluiria tambem os index.html de subpastas, que nunca seriam
# copiados.
Copiar $or $si @('/E', '/XF', (Join-Path $or 'index.html'), (Join-Path $or 'web.config'))
[Console]::Out.WriteLine('CODIGO OK')

Copiar $or $si @('web.config')
Copiar $or $si @('index.html')
[Console]::Out.WriteLine('VIRADO')

# Limpeza.
$naOrigem = @{}
Get-ChildItem -LiteralPath $or -Recurse -File | ForEach-Object {
    $naOrigem[$_.FullName.Substring($or.Length + 1).ToLower()] = $true
}
$limite = (Get-Date).AddDays(-$ManterDias)
$removidos = 0
$mantidos = 0
Get-ChildItem -LiteralPath $si -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($si.Length + 1)
    if ($naOrigem.ContainsKey($rel.ToLower())) { return }
    if ($rel.ToLower().StartsWith('app\') -and $_.LastWriteTime -gt $limite) { $mantidos++; return }
    Remove-Item -LiteralPath $_.FullName -Force
    $removidos++
}
# Pastas que ficaram vazias, da mais funda para a mais rasa. Pasta vazia com
# nome de rota (o caso do /avisos, em 22/10) volta a dar 403.
Get-ChildItem -LiteralPath $si -Recurse -Directory |
    Sort-Object { $_.FullName.Length } -Descending |
    Where-Object { -not (Get-ChildItem -LiteralPath $_.FullName -Force) } |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }

[Console]::Out.WriteLine("LIMPEZA OK: $removidos removidos, $mantidos pedacos de codigo antigo mantidos por $ManterDias dias")
