---
name: sddx-propose
description: Turn a resolved SDDx exploration into durable proposal, requirements, design, tasks, and optional RFC artifacts.
---

# SDDx Propose

Read the exploration and project context before writing. Read `sddx/schemas/spec-driven/schema.yaml` and its templates first; they are the authoritative OpenSpec-compatible artifact contract. Create or update the proposal, capability delta specs, conditional design, and verification-bearing tasks required by that schema, then maintain SDDx decisions, risks, and handoff records. For an existing compatibility-layout project, use its configured `openspec/` schema path instead.

Use `sddx-capability-router` to select the relevant OpenSpec proposal/design capability plus architecture, product, UX, domain, security, and DevOps skills. Preserve SDDx's stage and handoff rules when an upstream capability has a different preferred artifact format.

Recommend an RFC or architecture document for cross-team, architectural, breaking, security-sensitive, infrastructure, or high-risk changes. Ask before publishing externally. Keep the local RFC as the canonical source and treat Confluence or another provider as a published projection.

Do not implement code. End by recommending `$sddx-apply`, `$sddx-quick`, `$sddx-debug`, or a return to `$sddx-explore` when the artifacts are not ready.

When the proposal is approved, persist the handoff with `sddx stage <change-name> apply` and update `handoff.md`.
