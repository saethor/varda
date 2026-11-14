// Test-only: in-memory fakes and behaviour suites for the Shared context's ports (ADR 0008).
export { createInMemoryPersons, createSequentialIds, createSharedFakes } from './fakes.ts';
export { describePersons, type PersonsSetup } from './persons.ts';
