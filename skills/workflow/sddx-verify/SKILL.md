---
name: sddx-verify
description: Verify the complete SDDx change against its specifications, architecture, implementation, tests, security, operations, and deployment expectations.
---

# SDDx Verify

This is the single SDDx quality gate. Do not expose a separate validate workflow to users. Internally, verify must check the OpenSpec schema contract and may perform artifact, architecture, implementation, test, security, performance, deployment, and documentation checks as applicable.

Determine whether implementation files changed. If they did, verification is mandatory before archive and must include evidence from tests and relevant checks. If no implementation changed, verify the non-code artifacts or document why verification is not applicable.

Use `sddx-capability-router` to select testing, TDD, code-review, architecture, security, performance, DevOps, release, and documentation skills applicable to this change. Run relevant checks rather than every capability, and record the selected capabilities and evidence in `verification.md`.

Write `verification.md` with the checks run, evidence, failures, unresolved risks, and recommended next workflow. If verification fails, recommend the smallest corrective workflow: debug, apply, explore, or propose. If it passes, recommend `/sddx:archive`.

After a passing gate, persist the stage with `sddx stage <change-name> archive` before handing off to archive.
