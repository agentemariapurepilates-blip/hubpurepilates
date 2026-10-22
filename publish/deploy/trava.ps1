# Trava de deploy: um deploy por vez.
#
# Dois deploys ao mesmo tempo misturariam arquivos de duas versoes na mesma
# pasta de staging. Ja aconteceu de duas maquinas publicarem em sequencia sem
# saber uma da outra (Timeline de setembro); ao mesmo tempo seria pior.
#
# Criar diretorio e atomico no Windows: se dois tentam juntos, so um consegue.
# Dentro fica quem travou e quando, para quem encontrar a trava saber de quem e.

param(
    [Parameter(Mandatory = $true)][ValidateSet('travar', 'destravar')][string]$Acao,
    [string]$Info = ''
)

$ErrorActionPreference = 'Stop'
$trava = Join-Path (Get-Location) 'hub.purepilates.com.br\deploy.lock'

if ($Acao -eq 'travar') {
    try {
        New-Item -ItemType Directory -Path $trava -ErrorAction Stop | Out-Null
    } catch {
        $quem = Get-Content (Join-Path $trava 'quem.txt') -ErrorAction SilentlyContinue
        [Console]::Out.WriteLine("OCUPADO: $quem")
        exit 3
    }
    Set-Content -Path (Join-Path $trava 'quem.txt') -Value $Info -Encoding ASCII
    [Console]::Out.WriteLine('TRAVADO')
} else {
    if (Test-Path $trava) { Remove-Item -Path $trava -Recurse -Force }
    [Console]::Out.WriteLine('LIVRE')
}
