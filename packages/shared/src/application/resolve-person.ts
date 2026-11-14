import type { LoginAccount, Person } from '../domain/person.ts';
import type { SharedAdapters } from './shared-adapters.ts';

/**
 * The person for a login account, creating one if it has none. Used both when a
 * login account is created and on every signed-in request (the safety net), so
 * the two may race: `Persons.createFor` is idempotent, so they race harmlessly.
 */
export async function resolvePerson(adapters: SharedAdapters, loginAccount: LoginAccount): Promise<Person> {
  return (
    (await adapters.persons.findFor(loginAccount.id)) ??
    (await adapters.persons.createFor({
      id: adapters.ids.next(),
      loginAccount: loginAccount.id,
      name: loginAccount.name,
    }))
  );
}
