# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is a **multi-context monorepo** (ADR 0005, ADR 0006). Each context is a package: `packages/shared`, `packages/plan` and `packages/record`. Until those packages are created, their glossaries live in `docs/contexts/{shared,plan,record}/`.

## Before exploring, read these

- **`GLOSSARY-MAP.md`** at the repo root, if it exists: it points at one `GLOSSARY.md` per context (package). Read each one relevant to the topic.
- **`GLOSSARY.md`** at the repo root, if there's no map yet (early, pre-package phase).
- **`docs/adr/`**: system-wide ADRs. Read the ones that touch the area you're about to work in. Also check `packages/<context>/docs/adr/` for context-specific decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill creates them lazily when terms or decisions actually get resolved, including `GLOSSARY-MAP.md` once the first packages exist.

## File structure

```
/
├── GLOSSARY-MAP.md                    ← points at each context's GLOSSARY.md
├── docs/adr/                          ← system-wide decisions
├── apps/
│   ├── web/                           ← React SPA (no domain logic)
│   └── api/                           ← Hono + oRPC, wires the contexts together
└── packages/
    ├── shared/                        ← one package per context
    │   ├── GLOSSARY.md
    │   └── docs/adr/                  ← context-specific decisions
    ├── plan/
    │   ├── GLOSSARY.md
    │   └── docs/adr/
    └── record/
        ├── GLOSSARY.md
        └── docs/adr/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
