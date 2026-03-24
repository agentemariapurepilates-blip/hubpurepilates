#!/bin/bash
# =============================================================================
# Hub Pure Pilates - Deploy Frontend para Produção (macOS/Linux)
# =============================================================================
# Uso:
#   ./deploy.sh              -> build + deploy
#   ./deploy.sh --upload-only -> apenas upload (sem rebuild)
#
# Requer: sshpass (instalar com: brew install sshpass)
# Se sshpass não estiver disponível, usa rsync com prompt de senha
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

# Carregar credenciais do .env.deploy
if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo "ERRO: Arquivo .env.deploy não encontrado!"
  echo ""
  echo "Crie o arquivo .env.deploy na raiz do projeto com:"
  echo "  DEPLOY_HOST=seu.servidor.ip"
  echo "  DEPLOY_USER=seu_usuario"
  echo "  DEPLOY_PASS=sua_senha"
  echo "  DEPLOY_REMOTE_PATH=/caminho/remoto"
  echo ""
  exit 1
fi

source "$ENV_FILE"

if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ] || [ -z "$DEPLOY_PASS" ] || [ -z "$DEPLOY_REMOTE_PATH" ]; then
  echo "ERRO: Variáveis faltando no .env.deploy"
  exit 1
fi

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

# — Deploy Frontend ———————————————————————————————————————————
echo ""
echo "[2/2] Enviando frontend para o servidor..."

if command -v sshpass &> /dev/null; then
  sshpass -p "$DEPLOY_PASS" rsync -avz --delete \
    -e "ssh -o StrictHostKeyChecking=no" \
    "$SCRIPT_DIR/dist/" \
    "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REMOTE_PATH}/"
else
  echo ""
  echo "sshpass não encontrado. Você precisará digitar a senha manualmente."
  echo "Senha: (verifique o .env.deploy)"
  echo ""
  rsync -avz --delete \
    -e "ssh -o StrictHostKeyChecking=no" \
    "$SCRIPT_DIR/dist/" \
    "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_REMOTE_PATH}/"
fi

echo ""
echo "============================================"
echo "  Deploy concluído com sucesso!"
echo "============================================"
echo "  Frontend: https://hub.purepilates.com.br/"
echo ""
