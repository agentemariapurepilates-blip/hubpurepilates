#!/bin/bash
# =============================================================================
# Hub Pure Pilates - deploy SEM tirar o site do ar, subindo so o que mudou
# =============================================================================
#
#   ./deploy-rapido.sh             build + publica
#   ./deploy-rapido.sh --simular   mostra o que subiria e apagaria; nao toca no site
#   ./deploy-rapido.sh --sem-build publica o dist/ que ja existe
#   ./deploy-rapido.sh --voltar    volta o site para a versao anterior, em segundos
#   ./deploy-rapido.sh --destravar libera uma trava esquecida (ver "Trava" abaixo)
#
# POR QUE EXISTE (22/10/2026). O deploy.sh apaga o site inteiro e depois sobe
# os 289 MB do build. Do primeiro ao ultimo arquivo, o Hub responde 403 para a
# rede toda: 10 minutos num dia bom, 55 no dia em que a conexao caiu no meio
# (22/09). Desses 289 MB, so 7 sao codigo; o resto e midia que quase nunca muda.
#
# COMO FUNCIONA
#   1. Confere o git: local identico ao GitHub, nos dois sentidos. Se nao
#      estiver, para. O CLAUDE.md sempre exigiu isso, mas so por disciplina, e
#      deploy de checkout atrasado ja reverteu a producao.
#   2. Build (o mesmo do deploy.sh).
#   3. Pergunta ao servidor o hash de cada arquivo da pasta deploy-staging, que
#      guarda a ultima versao publicada FORA do site, e sobe so o que mudou.
#   4. No servidor, de disco para disco: guarda o site atual, copia o codigo
#      novo ao lado do antigo e troca o index.html por ultimo (publish/deploy/
#      virar.ps1). O site nao sai do ar em nenhum momento.
#   5. Confere no ar, pelo CONTEUDO: status 200 sozinho nao prova nada aqui,
#      porque a reescrita do SPA devolve 200 para arquivo inexistente.
#
# O deploy.sh continua existindo e intocado, como plano B.
#
# CREDENCIAIS: lidas do deploy.sh, para a senha continuar existindo num lugar
# so. Nada de credencial e escrito por este script.
# =============================================================================

set -euo pipefail

RAIZ="$(cd "$(dirname "$0")" && pwd)"
cd "$RAIZ"

ler() { grep -m1 "^$1=" deploy.sh | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
HOST="$(ler DEPLOY_HOST)"
USUARIO="$(ler DEPLOY_USER)"
SENHA="$(ler DEPLOY_PASS)"
if [ -z "$HOST" ] || [ -z "$USUARIO" ] || [ -z "$SENHA" ]; then
  echo "ERRO: nao consegui ler DEPLOY_HOST, DEPLOY_USER e DEPLOY_PASS do deploy.sh."
  exit 1
fi
command -v sshpass >/dev/null || { echo "ERRO: falta o sshpass (brew install hudochenkov/sshpass/sshpass)."; exit 1; }

# Pastas no servidor, relativas a pasta do usuario (D:\hostingspaces\douglas).
SITE='hub.purepilates.com.br\wwwroot'
STAGING='hub.purepilates.com.br\deploy-staging'
ANTERIOR='hub.purepilates.com.br\deploy-anterior'
FERRAMENTAS='hub.purepilates.com.br\deploy-tools'
SFTP_STAGING='/hub.purepilates.com.br/deploy-staging'
SFTP_FERRAMENTAS='/hub.purepilates.com.br/deploy-tools'
URL='https://hub.purepilates.com.br'

MODO="publicar"
CONSTRUIR=true
for arg in "$@"; do
  case "$arg" in
    --simular) MODO="simular" ;;
    --voltar) MODO="voltar"; CONSTRUIR=false ;;
    --destravar) MODO="destravar"; CONSTRUIR=false ;;
    --sem-build) CONSTRUIR=false ;;
    *) echo "Opcao desconhecida: $arg"; exit 1 ;;
  esac
done

TMP="$(mktemp -d)"
TRAVADO=false
OPC=(-o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=8)

remoto() { sshpass -p "$SENHA" ssh "${OPC[@]}" "$USUARIO@$HOST" "$1"; }
ps1() { remoto "powershell -NoProfile -ExecutionPolicy Bypass -File $FERRAMENTAS\\$1"; }
# BatchMode=no: o sftp em modo lote (-b) liga o BatchMode sozinho, e com ele o
# login por senha some — o sshpass nao tem onde entregar a senha e o servidor
# responde "Permission denied". Os comandos continuam vindo do arquivo de lote.
lote() { sshpass -p "$SENHA" sftp "${OPC[@]}" -o BatchMode=no -b "$1" "$USUARIO@$HOST" >"$TMP/sftp.log" 2>&1 || { cat "$TMP/sftp.log"; return 1; }; }

liberar() {
  if [ "$TRAVADO" = true ]; then ps1 "trava.ps1 -Acao destravar" >/dev/null || true; fi
  rm -rf "$TMP"
}
trap liberar EXIT

passo() { echo ""; echo "[$1] $2"; }

# — ferramentas do servidor sobem a cada uso: sao 4 arquivos pequenos, e assim
#   a versao que roda la e sempre a deste checkout.
subir_ferramentas() {
  {
    echo "-mkdir \"$SFTP_FERRAMENTAS\""
    for f in publish/deploy/*.ps1; do echo "put \"$RAIZ/$f\" \"$SFTP_FERRAMENTAS/$(basename "$f")\""; done
  } >"$TMP/ferramentas.sftp"
  lote "$TMP/ferramentas.sftp"
}

if [ "$MODO" = "destravar" ]; then
  subir_ferramentas
  ps1 "trava.ps1 -Acao destravar"
  exit 0
fi

# — 1. git ————————————————————————————————————————————————————————————————
if [ "$MODO" != "voltar" ]; then
  passo 1 "Conferindo o git..."
  git fetch -q origin
  FRENTE=$(git log origin/main..HEAD --oneline | wc -l | tr -d ' ')
  ATRAS=$(git log HEAD..origin/main --oneline | wc -l | tr -d ' ')
  # O deploy.sh fica de fora da conta: ele guarda a senha nova, que nao vai pro git.
  SUJO=$(git status --porcelain --untracked-files=no | grep -v ' deploy.sh$' || true)
  if [ "$FRENTE" != 0 ] || [ "$ATRAS" != 0 ] || [ -n "$SUJO" ]; then
    echo "      Local diferente do GitHub: $FRENTE commit(s) sem push, $ATRAS atras."
    [ -n "$SUJO" ] && echo "      Arquivos alterados sem commit:" && echo "$SUJO" | sed 's/^/        /'
    if [ "$MODO" = "simular" ]; then
      echo "      (simulacao: sigo assim mesmo, mas um deploy de verdade pararia aqui)"
    else
      echo "      Publicar assim pode tirar do ar o trabalho de outra pessoa. Sincronize e rode de novo."
      exit 1
    fi
  else
    echo "      OK: local identico ao GitHub ($(git log --oneline -1 | cut -c1-60))."
  fi
fi

# — 2. build ———————————————————————————————————————————————————————————————
if [ "$CONSTRUIR" = true ]; then
  passo 2 "Build..."
  npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund >/dev/null
  npm run build >"$TMP/build.log" 2>&1 || { tail -30 "$TMP/build.log"; exit 1; }
  echo "      OK."
fi
if [ "$MODO" != "voltar" ]; then
  [ -f dist/index.html ] || { echo "ERRO: dist/ sem index.html. Rode sem --sem-build."; exit 1; }
  cp publish/root-web.config dist/web.config
fi

# — servidor ——————————————————————————————————————————————————————————————
passo 3 "Preparando o servidor..."
subir_ferramentas
if [ "$MODO" != "simular" ]; then
  QUEM="$(hostname -s) · $(git config user.name 2>/dev/null || whoami) · $(date '+%d/%m %H:%M') · $(git log --oneline -1 | cut -c1-7)"
  if ! ps1 "trava.ps1 -Acao travar -Info \"$QUEM\"" | tr -d '\r' | tee "$TMP/trava.txt" | grep -q TRAVADO; then
    echo "      Outro deploy esta em andamento: $(cat "$TMP/trava.txt")"
    echo "      Se for uma trava esquecida (o outro deploy morreu), rode: ./deploy-rapido.sh --destravar"
    exit 1
  fi
  TRAVADO=true
fi
echo "      OK."

if [ "$MODO" = "voltar" ]; then
  passo 4 "Voltando para a versao anterior..."
  ps1 "virar.ps1 -Origem hub.purepilates.com.br\\deploy-anterior -Site $SITE" | tr -d '\r' | sed 's/^/      /'
else
  passo 4 "Comparando o build com o que ja esta no servidor..."
  ps1 "listar.ps1 -Pasta $STAGING" | tr -d '\r' >"$TMP/servidor.txt"
  python3 publish/deploy/diferenca.py dist "$TMP/servidor.txt" "$TMP" "$SFTP_STAGING"
  read -r N_SOBE MB_SOBE N_APAGA N_TOTAL MB_TOTAL <"$TMP/resumo.txt"
  echo "      Sobe: $N_SOBE de $N_TOTAL arquivos ($MB_SOBE de $MB_TOTAL MB). Sai: $N_APAGA arquivo(s)."

  if [ "$MODO" = "simular" ]; then
    echo ""
    echo "      Simulacao: o site NAO foi tocado. Os primeiros envios seriam:"
    grep '^put' "$TMP/lote.sftp" | head -15 | sed -E 's/^put "[^"]*" "[^"]*deploy-staging\//        /; s/"$//'
    [ "$N_APAGA" != 0 ] && grep '^rm' "$TMP/lote.sftp" | head -10 | sed -E 's/^rm "[^"]*deploy-staging\//        apagar: /; s/"$//'
    exit 0
  fi

  if [ "$N_SOBE" != 0 ] || [ "$N_APAGA" != 0 ]; then
    passo 5 "Enviando para a staging (o site continua no ar)..."
    INICIO=$(date +%s)
    lote "$TMP/lote.sftp"
    echo "      OK em $(( $(date +%s) - INICIO ))s."
  else
    passo 5 "Nada novo para enviar."
  fi

  passo 6 "Virando a versao (disco para disco, no servidor)..."
  ps1 "virar.ps1 -Origem $STAGING -Site $SITE -Backup $ANTERIOR" | tr -d '\r' | sed 's/^/      /'
fi

# — 7. conferencia no ar ——————————————————————————————————————————————————
passo 7 "Conferindo no ar..."
FALHOU=false
HOME_HTML="$(curl -s --max-time 30 "$URL/")"
if [ "$MODO" = "voltar" ]; then
  BUNDLE="$(echo "$HOME_HTML" | grep -o 'app/index-[^"]*\.js' | head -1)"
  [ -n "$BUNDLE" ] && echo "      Pagina inicial servindo $BUNDLE." || { echo "      FALHA: pagina inicial sem pacote."; FALHOU=true; }
else
  BUNDLE="$(grep -o 'app/index-[^"]*\.js' dist/index.html | head -1)"
  if echo "$HOME_HTML" | grep -q "$BUNDLE"; then echo "      Versao nova no ar ($BUNDLE)."; else echo "      FALHA: o ar nao esta servindo $BUNDLE."; FALHOU=true; fi
  NO_AR=$(curl -s --max-time 60 "$URL/$BUNDLE" | wc -c | tr -d ' ')
  LOCAL=$(wc -c <"dist/$BUNDLE" | tr -d ' ')
  if [ "$NO_AR" = "$LOCAL" ]; then echo "      Pacote completo ($LOCAL bytes)."; else echo "      FALHA: pacote no ar com $NO_AR bytes, local $LOCAL."; FALHOU=true; fi
fi
# Link direto em tela interna: depende do web.config e pega o caso pasta-com-nome-de-rota.
for rota in /avisos /inauguracoes; do
  R=$(curl -s -o /dev/null -w '%{http_code} %{content_type}' --max-time 20 "$URL$rota")
  case "$R" in 200\ text/html*) echo "      $rota abre ($R)." ;; *) echo "      FALHA: $rota respondeu $R."; FALHOU=true ;; esac
done

echo ""
if [ "$FALHOU" = true ]; then
  echo "============================================"
  echo "  ATENCAO: a conferencia falhou."
  echo "  Para voltar a versao anterior: ./deploy-rapido.sh --voltar"
  echo "============================================"
  exit 1
fi
echo "============================================"
echo "  Pronto. $URL/"
echo "============================================"
