#!/bin/sh
# `pnpm lint:vocabulary`: the domain speaks of persons and login accounts, never
# "user" (ADR 0006, packages/shared/GLOSSARY.md). Only the auth adapter, which
# wraps Better Auth's "user", may say it. Docs (*.md) may name the word they avoid.
# dependency-cruiser sees imports, not identifiers, hence a grep.

# Third-party settings named by their images, not by us.
allowed='POSTGRES_USER|MINIO_ROOT_USER'

found=$(git grep --untracked -I -n -i 'user' -- \
  apps packages scripts .github docker-compose.yml '*.json' '*.ts' '*.cjs' \
  ':!apps/api/src/auth/**' ':!*.md' ':!pnpm-lock.yaml' ':!scripts/check-vocabulary.sh' |
  grep -v -E "$allowed")

if [ -n "$found" ]; then
  echo 'Say "person" or "login account", not "user" (only apps/api/src/auth/ may wrap Better Auth'"'"'s "user"):'
  echo "$found"
  exit 1
fi
