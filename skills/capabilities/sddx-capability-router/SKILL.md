---
name: sddx-capability-router
description: Select and invoke the most relevant bundled capability skills for the current SDDx workflow stage, role, risk, and technology. Use automatically at workflow handoffs or manually when a specialized capability is needed.
---

# SDDx Capability Router

Read `.sddx/capability-catalog.json` before selecting supporting skills. When the SDDx CLI is available, use `sddx skills recommend --stage <stage> --role <roles> --query <terms>` to rank them. The catalog contains the bundled OpenSpec, ai-skills, and grill-skills entries, their source revisions, roles, stages, and direct paths.

Use the SDDx-native workflow and schema as the default execution path. A small subset of the imported OpenSpec workflow skills declares `Requires openspec CLI`; those remain bundled for manual use and reference, but are not automatically recommended unless the user explicitly requests `--include-external` and has that CLI available. This prevents an installed SDDx project from selecting a command that it cannot execute.

Select capabilities using this order:

1. Match the current SDDx stage: `explore`, `propose`, `apply`, `verify`, `debug`, or `archive`.
2. Match the active role or concern: product, facilitation, UX, architect, engineering, debugging, security, DevOps, release, or documentation.
3. Match the change's domain and technology keywords.
4. Invoke the smallest useful set: normally one primary skill and up to three supporting skills. Keep the complete catalog available for manual invocation.

## Default stage bindings

Use these as starting points, then narrow them with the change domain and risk:

| Stage | Primary capability families | Supporting families |
| --- | --- | --- |
| `explore` | grilling, discovery, research | product, UX, domain, architecture, DevOps, security |
| `propose` | system design, codebase design, domain modeling | OpenSpec artifacts, clean architecture, product, UX, security, operations |
| `apply` | implementation, TDD, clean code | refactoring, platform, UX, documentation, release |
| `verify` | code review, TDD, quality | architecture, security, performance, DevOps, UX, documentation |
| `debug` | diagnosis, triage, reproduction | legacy-code, systems, observability, regression testing |
| `archive` | handoff, technical documentation, release | ticketing, retrospectives, specification synchronization |

The generated catalog assigns stage priorities to these families so recommendations are ordered by workflow usefulness rather than alphabetical skill name.

During `explore`, invoke grilling and discovery capabilities automatically when requirements, constraints, architecture, technology, rollout, deployment, or operational concerns are unclear. During `apply`, prefer implementation and testing capabilities. During `verify`, prefer testing, review, architecture, security, and operational capabilities. During `debug`, prefer diagnosis, reproduction, and regression capabilities.

The SDDx workflow skill remains the lifecycle authority. A bundled capability skill supplies domain method and expertise; it does not bypass durable artifacts, stage handoffs, verification, or archive rules. Record which capabilities materially influenced a decision in the active change's `decisions.md` or `verification.md`.

Every bundled capability is also available for direct manual invocation by its catalog `id` or installed skill directory.
