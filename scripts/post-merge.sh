#!/bin/bash
set -e
pnpm install --frozen-lockfile
# Development only. Preserve unrelated, unmodelled tables; never run schema DDL
# in application startup or against production.
pnpm --filter @workspace/db exec drizzle-kit push --config ./drizzle.finance.config.ts
