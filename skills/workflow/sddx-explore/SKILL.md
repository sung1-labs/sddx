---
name: sddx-explore
description: Explore a change before implementation, resolve the applicable product, UX, architecture, security, testing, deployment, and operational questions, and recommend the next SDDx workflow.
---

# SDDx Explore

Explore without implementing code. Read the repository and existing SDDx/OpenSpec artifacts first. Use the grilling capability automatically when the goal, constraints, domain language, architecture, technology choice, rollout, deployment, observability, rollback, or ownership is unclear.

Before each grilling round, use `sddx-capability-router` to select relevant bundled discovery, product, UX, architecture, domain, DevOps, security, and documentation skills. Prefer the grill-skills grilling/research capabilities for questioning and the ai-skills discovery/design capabilities for domain context. Invoke only the relevant subset and record material inputs.

Run focused rounds only for concerns relevant to the change. Record confirmed decisions, rejected alternatives, risks, unresolved questions, and applicability decisions in the active change's durable artifacts.

Before recommending proposal creation, confirm each applicable concern is resolved or explicitly documented as deferred with a reason and risk. If the user asks to capture the work, recommend `$sddx-propose`.

Always end with:

- What was learned.
- What was recorded.
- What remains unresolved.
- The recommended next workflow and alternatives.

When the exploration is ready for proposal, persist the handoff with `sddx stage <change-name> propose` and update `handoff.md`. In Codex, the next skill is `$sddx-propose`.
