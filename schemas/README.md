# SDDx schemas

SDDx ships the OpenSpec-compatible `spec-driven` schema and its original schema templates. The package installs a project copy at `openspec/schemas/spec-driven/` so the artifact contract remains available to any agent without hidden package state.

The schema defines the canonical planning artifacts:

```text
proposal → specs + design → tasks → apply
```

`design` is conditional. `specs` may be skipped only when the change metadata explicitly sets `skip_specs: true` for a change with no spec-level behavior change. SDDx adds exploration, handoff, verification, and routing artifacts around this OpenSpec contract.

The authoritative imported schema and templates are under `spec-driven/`; see the source manifest and third-party notices for the pinned revision and license.
