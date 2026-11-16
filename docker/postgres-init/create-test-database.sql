-- Runs once, when the Postgres volume is first created (docker-entrypoint-initdb.d).
-- The test suites' own database, so `pnpm test:adapters` and `pnpm test:e2e` never write
-- into the `varda` database `pnpm dev` uses (TEST_DATABASE_URL in .env.example).
CREATE DATABASE varda_test OWNER varda;
