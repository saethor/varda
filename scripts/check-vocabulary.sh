#!/bin/sh
# `pnpm lint:vocabulary`: the domain speaks of persons and login accounts, never
# "user" (ADR 0006, packages/shared/GLOSSARY.md). Only the auth adapter, which
# wraps Better Auth's "user", may say it. Docs (*.md) may name the word they avoid.
# dependency-cruiser sees imports, not identifiers, hence a grep.

# Third-party names, not ours: settings named by their images, and TanStack Router's
# useRouter, useRouteContext and friends (where "user" is only "use" + "Route").
allowed='POSTGRES_USER|MINIO_ROOT_USER|useRoute'

found=$(git grep --untracked -I -n -i 'user' -- \
  apps packages scripts .github docker-compose.yml '*.json' '*.ts' '*.cjs' \
  ':!apps/api/src/auth/**' ':!apps/web/src/sign-in/sign-in.ts' ':!*.md' ':!pnpm-lock.yaml' ':!scripts/check-vocabulary*.sh' |
  grep -v -E "$allowed")

if [ -n "$found" ]; then
  echo 'Say "person" or "login account", not "user" (only apps/api/src/auth/ and apps/web/src/sign-in/sign-in.ts may wrap Better Auth'"'"'s "user"):'
  echo "$found"
  exit 1
fi
