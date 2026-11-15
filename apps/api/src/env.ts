// Read only by the entry points (main.ts, migrate.ts, seed.ts), at startup (ADR 0008).

/** The environment variable `name`, or stop before any work starts, naming it. */
export function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see .env.example).`);
  return value;
}
