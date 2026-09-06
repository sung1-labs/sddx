---
name: sddx-quick
description: Handle a small, bounded change with minimal durable artifacts while preserving verification and automatic escalation when scope grows.
---

# SDDx Quick

Use for a small, reversible, low-risk change. Capture intent and tasks, implement the smallest slice, and run SDDx verification. Keep the record compact but complete.

Use `sddx-capability-router` to select only the smallest relevant capability set. Quick work may use a single implementation or UX skill, but it must escalate when the router detects architecture, security, infrastructure, migration, public-contract, or technology risk.

Escalate to the full workflow when the change involves public contracts, migrations, security, infrastructure, new technology, multiple services, architectural impact, or unclear requirements.

Recommended flow: intent → tasks → apply → verify → archive.
