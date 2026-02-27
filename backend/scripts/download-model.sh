#!/usr/bin/env bash
set -euo pipefail

DESTINATION="${1:-models}"
MODEL_FILE="${2:-Qwen2.5-1.5B-Instruct-Q4_K_M.gguf}"

mkdir -p "${DESTINATION}"
OUTPUT_PATH="${DESTINATION}/${MODEL_FILE}"

if [[ -f "${OUTPUT_PATH}" ]]; then
  echo "Model already present: ${OUTPUT_PATH}"
  exit 0
fi

URL="https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/${MODEL_FILE}"
echo "Downloading model to ${OUTPUT_PATH}"
curl -L -C - --retry 5 --retry-delay 5 --fail "${URL}" -o "${OUTPUT_PATH}"
BYTES="$(wc -c < "${OUTPUT_PATH}")"
if [[ "${BYTES}" -lt 100000000 ]]; then
  echo "Model file too small (${BYTES} bytes). Download likely incomplete."
  exit 1
fi
echo "Download complete."
