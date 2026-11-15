#!/bin/sh
# `pnpm lint:vocabulary`: the domain speaks of persons and login accounts, never
# "user" (ADR 0006, packages/shared/GLOSSARY.md). Only the auth adapter
# (apps/api/src/auth/) and the web sign-in module (apps/web/src/sign-in/sign-in.ts),
# which wrap Better Auth's "user", may say it. Docs (*.md) may name the word they avoid.
# dependency-cruiser sees imports, not identifiers, hence a grep.

# Third-party names, not ours: settings named by their images, and TanStack Router's
# useRouter, useRouteContext and friends (where "user" is only "use" + "Route").
# Only the names themselves are let through, not the rest of their line.
allowed='POSTGRES_USER|MINIO_ROOT_USER|useRoute'

found=$(git grep --untracked -I -n -i 'user' -- \
  apps packages scripts .github docker-compose.yml '*.json' '*.ts' '*.cjs' \
  ':!apps/api/src/auth/**' ':!apps/web/src/sign-in/sign-in.ts' ':!*.md' ':!pnpm-lock.yaml' ':!scripts/check-vocabulary*.sh' |
  awk -v allowed="$allowed" '{
    # Look past "path:line:" at the matched text, with the allowed names taken out.
    text = $0; sub(/^[^:]*:[0-9]+:/, "", text); gsub(allowed, "", text)
    if (tolower(text) ~ /user/) print
  }')

if [ -n "$found" ]; then
  echo 'Say "person" or "login account", not "user" (only apps/api/src/auth/ and apps/web/src/sign-in/sign-in.ts may wrap Better Auth'"'"'s "user"):'
  echo "$found"
  exit 1
fi
