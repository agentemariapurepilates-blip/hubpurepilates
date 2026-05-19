#!/bin/bash
# =============================================================================
# Hub Pure Pilates - Deploy Frontend para Produção (macOS/Linux)
# =============================================================================
# Uso:
#   ./deploy.sh              -> build + deploy incremental (só arquivos mudados)
#   ./deploy.sh --upload-only -> apenas upload (sem rebuild)
#   ./deploy.sh --full        -> reenvia TUDO mesmo que não tenha mudado
#
# Pré-requisito (uma vez):
#   brew install lftp
# =============================================================================

set -e

DEPLOY_HOST="54.200.117.84"
DEPLOY_USER="ftp_sistemas"
DEPLOY_PASS="Xk9#mPv#2wLq!8Tz"
DEPLOY_REMOTE_PATH="/hub.purepilates.com.br/wwwroot"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

UPLOAD_ONLY=false
FULL=false
for arg in "$@"; do
  case "$arg" in
    --upload-only) UPLOAD_ONLY=true ;;
    --full) FULL=true ;;
  esac
done

# — Build frontend ————————————————————————————————————————————
if [ "$UPLOAD_ONLY" = false ]; then
  echo ""
  echo "[1/2] Compilando frontend (Production)..."
  cd "$SCRIPT_DIR"
  npm install --legacy-peer-deps
  npm run build
  echo "      Frontend OK."
fi

cd "$SCRIPT_DIR"

if [ ! -d "$SCRIPT_DIR/dist" ]; then
  echo "ERRO: Pasta dist/ não encontrada. Rode sem --upload-only primeiro."
  exit 1
fi

# Copiar web.config para IIS (SPA routing)
if [ -f "$SCRIPT_DIR/publish/root-web.config" ]; then
  cp "$SCRIPT_DIR/publish/root-web.config" "$SCRIPT_DIR/dist/web.config"
  echo "      web.config copiado."
fi

# — Deploy via lftp mirror (sync incremental sobre SFTP) ——————————————
echo ""
echo "[2/2] Enviando frontend (incremental)..."

if ! command -v lftp &> /dev/null; then
  echo ""
  echo "ERRO: lftp não está instalado."
  echo "Instale com: brew install lftp"
  exit 1
fi

MIRROR_FLAGS="--reverse --delete --parallel=4 --verbose --use-cache --no-perms"
if [ "$FULL" = true ]; then
  MIRROR_FLAGS="$MIRROR_FLAGS --ignore-time"
  echo "      Modo --full ativo: re-enviando todos os arquivos."
fi

lftp -u "${DEPLOY_USER},${DEPLOY_PASS}" "sftp://${DEPLOY_HOST}" <<LFTP_EOF
set sftp:auto-confirm yes
set net:timeout 30
set net:max-retries 3
set net:reconnect-interval-base 5
mirror $MIRROR_FLAGS "$SCRIPT_DIR/dist/" "${DEPLOY_REMOTE_PATH}/"
bye
LFTP_EOF

echo ""
echo "============================================"
echo "  Deploy concluído com sucesso!"
echo "============================================"
echo "  Frontend: https://hub.purepilates.com.br/"
echo ""
