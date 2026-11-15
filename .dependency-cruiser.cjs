// Module boundaries (ADR 0005). Run with `pnpm depcruise`.
const contexts = 'shared|plan|record';
const ioPackages = [
  'drizzle-orm',
  'pg',
  'postgres',
  'pg-boss',
  'hono',
  '@hono/',
  '@orpc/server',
  'better-auth',
  '@aws-sdk/',
  '@garmin/fitsdk',
].join('|');

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Import cycles hide the direction of dependencies.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'context-imports-only-shared',
      severity: 'error',
      comment:
        'Plan and Record never import each other. The reading context defines the interface it needs and apps/api wires the other implementation in.',
      from: { path: '^packages/(plan|record)/' },
      to: { path: '^packages/', pathNot: ['^packages/$1/', '^packages/shared/', '^packages/config/'] },
    },
    {
      name: 'shared-imports-no-context',
      severity: 'error',
      comment: 'Shared is the kernel; it depends on no other workspace package.',
      from: { path: '^packages/shared/' },
      to: { path: '^packages/', pathNot: ['^packages/shared/', '^packages/config/'] },
    },
    {
      name: 'domain-is-innermost',
      severity: 'error',
      comment: 'Domain code may not import application or adapter code.',
      from: { path: `^packages/(${contexts})/src/domain/` },
      to: { path: `^packages/(${contexts})/src/(application|adapters)/` },
    },
    {
      name: 'application-does-not-import-adapters',
      severity: 'error',
      comment: 'Use cases depend on interfaces; adapters implement them and are wired in apps/api.',
      from: { path: `^packages/(${contexts})/src/application/` },
      to: { path: `^packages/(${contexts})/src/adapters/` },
    },
    {
      name: 'no-io-packages-in-domain-or-application',
      severity: 'error',
      comment: 'Only adapters touch the database, HTTP, storage or Garmin (ADR 0007).',
      from: { path: `^packages/(${contexts})/src/(domain|application)/` },
      to: { path: `node_modules/(${ioPackages})` },
    },
    {
      name: 'no-node-builtins-in-domain-or-application',
      severity: 'error',
      comment: 'Only adapters use Node built-ins such as fs or net (ADR 0007).',
      from: { path: `^packages/(${contexts})/src/(domain|application)/` },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'contract-package-imports-only-contracts',
      severity: 'error',
      comment: '@varda/contract only composes the contexts’ contract subpaths.',
      from: { path: '^packages/contract/' },
      to: { path: '^packages/', pathNot: ['^packages/contract/', `^packages/(${contexts})/src/contract\\.ts$`] },
    },
    {
      name: 'web-imports-only-contracts-and-ui',
      severity: 'error',
      comment: 'The web app never touches server code, not even types.',
      from: { path: '^apps/web/' },
      to: {
        path: '^packages/',
        pathNot: ['^packages/(contract|ui|config)/', `^packages/(${contexts})/src/contract\\.ts$`],
      },
    },
    {
      name: 'only-the-web-sign-in-module-imports-better-auth',
      severity: 'error',
      comment: 'Only the sign-in module wraps Better Auth; the rest of the web app speaks of persons (ADR 0006).',
      from: { path: '^apps/web/', pathNot: '^apps/web/src/sign-in/sign-in\\.ts$' },
      to: { path: 'node_modules/better-auth/' },
    },
    {
      name: 'testing-code-only-in-tests',
      severity: 'error',
      comment: 'In-memory fakes, createTestApp and createRealApp are for tests only (ADR 0008).',
      from: {
        pathNot: ['\\.test\\.tsx?$', '^packages/[^/]+/src/testing(/|\\.ts$)', '^apps/api/src/(testing|real-app)\\.ts$'],
      },
      to: { path: ['^packages/[^/]+/src/testing(/|\\.ts$)', '^apps/api/src/(testing|real-app)\\.ts$'] },
    },
    {
      name: 'packages-do-not-import-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|\\.turbo)/|routeTree\\.gen\\.ts$' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'types', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.d.ts'],
    },
  },
};
