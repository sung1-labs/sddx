# SDDx and OpenSpec integration

SDDx uses OpenSpec as an artifact contract and foundation, while owning the broader lifecycle orchestration and capability library.

## Included in the package

- The OpenSpec `spec-driven` schema.
- The proposal, spec, design, and tasks templates.
- All 16 OpenSpec skill directories, including documentation-oriented skills.
- OpenSpec reference documentation and configuration guidance.
- OpenSpec-compatible `openspec/config.yaml` and `.openspec.yaml` metadata.

## SDDx extensions

SDDx adds exploration, decisions, handoff, verification, quick, and debugging artifacts around the OpenSpec planning graph. These extensions live in `.sddx.yaml` and do not replace the OpenSpec schema metadata.

The full workflow follows the OpenSpec dependency contract:

```text
proposal → specs + optional design → tasks → apply
```

`skip_specs: true` is reserved for changes with no spec-level behavior change. A full SDDx change must otherwise contain capability delta specs under `specs/<capability-path>/spec.md`.

## Deliberately not duplicated

SDDx does not vendor OpenSpec's TypeScript CLI runtime, release automation, test fixtures, dashboards, or repository development infrastructure. SDDx has its own CLI and uses the bundled schema, templates, documentation, and skills as its compatibility surface.

The next compatibility milestone is semantic validation and delta-spec synchronization during `sddx verify` and `sddx archive`. Until that is implemented, the bundled OpenSpec skills remain the authoritative agent guidance for those operations, while the SDDx CLI enforces the durable artifact and evidence gates.
