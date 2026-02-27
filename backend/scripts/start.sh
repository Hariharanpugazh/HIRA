#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if [[ ! -f ".env" ]]; then
  cp .env.example .env
fi

./scripts/download-model.sh

docker compose up -d --build

echo "API: http://localhost:8000/docs"
echo "LLM: http://localhost:8080/v1/models"
