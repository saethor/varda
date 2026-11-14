import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Persons } from '../../application/ports.ts';
import { persons } from './schema.ts';

const columns = { id: persons.id, name: persons.name };

export function createPostgresPersons(db: NodePgDatabase): Persons {
  async function findFor(loginAccount: string) {
    const [found] = await db.select(columns).from(persons).where(eq(persons.loginAccount, loginAccount));
    return found ?? null;
  }

  return {
    async createFor({ id, loginAccount, name }) {
      // The unique login account makes concurrent creates race harmlessly: the loser inserts nothing.
      const [created] = await db
        .insert(persons)
        .values({ id, loginAccount, name })
        .onConflictDoNothing({ target: persons.loginAccount })
        .returning(columns);
      if (created) return created;
      const existing = await findFor(loginAccount);
      if (!existing) throw new Error(`No person for login account ${loginAccount} after a conflicting create.`);
      return existing;
    },
    findFor,
    async byId(id) {
      const [found] = await db.select(columns).from(persons).where(eq(persons.id, id));
      return found ?? null;
    },
  };
}
