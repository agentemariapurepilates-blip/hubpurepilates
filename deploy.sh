#!/bin/bash
# =============================================================================
# Hub Pure Pilates - Deploy Frontend para Produção (macOS/Linux)
# =============================================================================
# Uso:
#   ./deploy.sh              -> build + deploy
#   ./deploy.sh --upload-only -> apenas upload (sem rebuild)
#
# Na primeira vez, instale o sshpass:
#   brew install hudochenkov/sshpass/sshpass
# =============================================================================

set -e

DEPLOY_HOST="54.200.117.84"
DEPLOY_USER="ftp_sistemas"
DEPLOY_PASS="Xk9#mPv#2wLq!8Tz"
DEPLOY_REMOTE_PATH="/hub.purepilates.com.br/wwwroot"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

UPLOAD_ONLY=false
if [ "$1" = "--upload-only" ]; then
  UPLOAD_ONLY=true
fi

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

# — Deploy Frontend ———————————————————————————————————————————
echo ""
echo "[2/2] Enviando frontend para o servidor..."

# Converter path para Windows format
WIN_REMOTE_PATH=$(echo "$DEPLOY_REMOTE_PATH" | sed 's|^/||' | sed 's|/|\\|g')

if command -v sshpass &> /dev/null; then
  # Limpar diretório remoto (servidor Windows)
  sshpass -p "$DEPLOY_PASS" ssh -o StrictHostKeyChecking=no \
    "${DEPLOY_USER}@${DEPLOY_HOST}" "powershell -Command \"Get-ChildItem -Path '${WIN_REMOTE_PATH}' -Recurse | Remove-Item -Recurse -Force\"" 2>/dev/null || true

  # Enviar arquivos via scp
  sshpass -p "$DEPLOY_PASS" scp -o StrictHostKeyChecking=no -r \
    "$SCRIPT_DIR/dist/"* \
    "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REMOTE_PATH}/"
else
  echo ""
  echo "sshpass não encontrado."
  echo "Instale com: brew install hudochenkov/sshpass/sshpass"
  echo ""
  echo "Senha para digitar manualmente: $DEPLOY_PASS"
  echo ""
  ssh -o StrictHostKeyChecking=no \
    "${DEPLOY_USER}@${DEPLOY_HOST}" "powershell -Command \"Get-ChildItem -Path '${WIN_REMOTE_PATH}' -Recurse | Remove-Item -Recurse -Force\"" 2>/dev/null || true

  scp -o StrictHostKeyChecking=no -r \
    "$SCRIPT_DIR/dist/"* \
    "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REMOTE_PATH}/"
fi

echo ""
echo "============================================"
echo "  Deploy concluído com sucesso!"
echo "============================================"
echo "  Frontend: https://hub.purepilates.com.br/"
echo ""
