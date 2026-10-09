#!/usr/bin/env bash
# One-shot: deploy main and attach bharatcloud.store to this project.
# Requires: export VERCEL_TOKEN=... (from https://vercel.com/account/tokens)
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Set VERCEL_TOKEN first (Vercel → Account → Tokens)."
  exit 1
fi

export VERCEL_ORG_ID="${VERCEL_ORG_ID:-}"
export VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

echo "Deploying production..."
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"

echo "Attaching domains..."
npx vercel domains add bharatcloud.store --token "$VERCEL_TOKEN" || true
npx vercel domains add www.bharatcloud.store --token "$VERCEL_TOKEN" || true

echo "Done. Open https://www.bharatcloud.store/ and https://www.bharatcloud.store/login"
