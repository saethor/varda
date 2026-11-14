#!/bin/sh
# Shows `scripts/check-vocabulary.sh` catches a leak, run in CI. It writes a
# throwaway fixture repo in a temp directory, which `pnpm test` must never do
# (ADR 0007), so it is a script rather than a Vitest test.
set -u

check="$(cd "$(dirname "$0")" && pwd)/check-vocabulary.sh"
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
cd "$fixture" && git init -q . || exit 1
mkdir -p apps/api/src/auth packages/shared/src

echo 'export const user = 1;' > apps/api/src/auth/better-auth.ts
if ! sh "$check" > /dev/null; then
  echo 'check-vocabulary.sh failed on "user" inside the auth adapter, where it is allowed.'
  exit 1
fi

echo 'export const user = 1;' > packages/shared/src/leak.ts
if sh "$check" > /dev/null; then
  echo 'check-vocabulary.sh passed with "user" leaked into packages/shared.'
  exit 1
fi

echo 'check-vocabulary.sh allows the auth adapter and catches a leak.'
