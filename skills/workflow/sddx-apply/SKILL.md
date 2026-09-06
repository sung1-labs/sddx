---
name: sddx-apply
description: Implement an approved SDDx change from its durable specifications and tasks while preserving a complete handoff trail.
---

# SDDx Apply

Read the active change artifacts, project instructions, and current status before implementing. Work in small slices, update task progress immediately, and record important decisions and discoveries.

Use `sddx-capability-router` before each implementation slice. Select the most relevant implementation, TDD, clean-code, architecture, documentation, and platform skills from the bundled library. If an upstream skill recommends a conflicting lifecycle, keep the SDDx artifact and verification contract authoritative.

Before using a new framework, library, platform, database, or infrastructure tool, run the project's technology-check workflow. Use approved bundled or pinned technology guidance before writing the integration.

If implementation exposes an unresolved product, architecture, security, deployment, or operational decision, pause and recommend returning to `$sddx-explore` or `$sddx-propose`. Do not silently invent a decision.

When tasks are complete, recommend `$sddx-verify`. Verification is mandatory whenever implementation files changed.

Before handoff, persist the stage with `sddx stage <change-name> verify` and update `handoff.md`.
