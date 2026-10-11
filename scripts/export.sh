#!/usr/bin/env bash
# Export / re-home BharatCloud to a clean git repo (e.g. github.com/.../bharatcloud).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

NEW_REPO_NAME="${NEW_REPO_NAME:-bharatcloud}"
NEW_REPO_URL="${NEW_REPO_URL:-https://github.com/YOUR_ORG/${NEW_REPO_NAME}.git}"

# Substrings that usually mean env still targets a prior client fork / project.
# Override: OLD_CLIENT_MARKERS="foo,bar" ./scripts/export.sh
DEFAULT_OLD_MARKERS=(
  "gorjrm"
  "gorjrmcourier"
  "rjrm-archiver"
  "rjrm"
  "bharatcloud-website"
  "sahilrana1940/bharatcloud-website"
)
IFS=',' read -r -a EXTRA_MARKERS <<< "${OLD_CLIENT_MARKERS:-}"
OLD_MARKERS=("${DEFAULT_OLD_MARKERS[@]}" "${EXTRA_MARKERS[@]}")

# Env files to scan (values only; .env.example is skipped unless CHECK_EXAMPLE=1)
ENV_FILES=()
for f in .env .env.local .env.development .env.production .env.preview; do
  [[ -f "$ROOT/$f" ]] && ENV_FILES+=("$f")
done
while IFS= read -r -d '' f; do
  base="$(basename "$f")"
  [[ "$base" == ".env.example" ]] && continue
  ENV_FILES+=("$base")
done < <(find "$ROOT" -maxdepth 1 -name '.env.*' -print0 2>/dev/null || true)

ENV_ISSUES=0

echo "== BharatCloud export check =="
echo "Root: $ROOT"
echo ""

echo "-- Env files scanned for old client project markers --"
if [[ ${#ENV_FILES[@]} -eq 0 ]]; then
  echo "  (none found — create .env.local from .env.example before deploy)"
else
  for ef in "${ENV_FILES[@]}"; do
    echo "  • $ef"
  done
fi
echo ""

check_line() {
  local file="$1" line="$2" key="$3" val="$4"
  local marker
  for marker in "${OLD_MARKERS[@]}"; do
    [[ -z "$marker" ]] && continue
    if [[ "$val" == *"$marker"* ]]; then
      echo "  ⚠ $file: $key contains legacy marker \"$marker\""
      echo "      → $val"
      ENV_ISSUES=$((ENV_ISSUES + 1))
    fi
  done
}

for ef in "${ENV_FILES[@]}"; do
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      val="${val%\"}"; val="${val#\"}"
      val="${val%\'}"; val="${val#\'}"
      check_line "$ef" "$line" "$key" "$val"
    fi
  done < "$ROOT/$ef"
done

# High-signal vars: warn if set but empty in local env
IMPORTANT_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  NEXT_PUBLIC_APP_URL
  GOOGLE_REDIRECT_URI
  ARCHIVE_S3_BUCKET
)
for ef in "${ENV_FILES[@]}"; do
  for v in "${IMPORTANT_VARS[@]}"; do
    if grep -q "^${v}=$" "$ROOT/$ef" 2>/dev/null; then
      echo "  ⚠ $ef: $v is empty"
      ENV_ISSUES=$((ENV_ISSUES + 1))
    fi
  done
done

if [[ "$ENV_ISSUES" -eq 0 ]]; then
  echo "  ✓ No legacy markers detected in local env files."
else
  echo ""
  echo "  Found $ENV_ISSUES issue(s). Fix values before pushing to the new repo."
fi
echo ""

write_gitignore() {
  cat > "$ROOT/.gitignore" <<'GITIGNORE'
# Dependencies
/node_modules
/backend/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# Next.js
/.next/
/out/
/build

# Flutter (if present)
/flutter/.dart_tool/
/flutter/build/
/flutter/.flutter-plugins-dependencies

# Tests & coverage
/coverage

# Environment & secrets
.env*
!.env.example

# Vercel / deploy
.vercel

# OS & logs
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE / local tooling
.idea/
.vscode/
.cursor/
GITIGNORE
  echo "Wrote clean .gitignore"
}

echo "-- .gitignore --"
write_gitignore
echo ""

echo "-- Git: push to new repo (${NEW_REPO_NAME}) --"
cat <<EOF
# From this directory ($ROOT):

git init   # safe if .git already exists

git add -A
git status

git commit -m "chore: initial export to ${NEW_REPO_NAME}"

# Point at your new empty GitHub repo (replace YOUR_ORG):
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin ${NEW_REPO_URL}

git push -u origin main
EOF

echo ""
if [[ "$ENV_ISSUES" -gt 0 ]]; then
  exit 1
fi
