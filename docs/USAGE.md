# SDDx usage guide

SDDx is a project-local, agent-neutral workflow toolkit for specification-driven development. It gives AI agents durable change artifacts, predictable lifecycle handoffs, verification gates, and routed product, architecture, UX, engineering, debugging, DevOps, and documentation skills.

The agent supplies reasoning and implementation. SDDx supplies durable state, stage transitions, quality gates, and capability selection.

## Requirements

- Node.js 20 or newer
- npm
- One or more supported AI-agent platforms

Install globally:

~~~bash
npm install -g @sung1-labs/sddx
~~~

## Initialize a project

Run the interactive initializer from the project root:

~~~bash
cd my-project
sddx init
~~~

For automation:

~~~bash
sddx init --platform codex,claude --no-interactive
~~~

Use --platform all to configure every supported platform. In interactive mode, use the arrow keys to move through the platform list, Space to select or deselect, Enter to confirm, `a` to select all, and Escape to cancel.

By default, SDDx creates one visible `sddx/` workspace containing the configuration, schemas, changes, specifications, explorations, and routing metadata. This keeps project-owned artifacts under the SDDx namespace while using the OpenSpec-compatible artifact contract. To initialize an existing project that must retain the OpenSpec layout, use:

~~~bash
sddx init --layout openspec --platform codex --no-interactive
~~~

By default, initialization installs the complete capability bundle. Use a profile or one or more exact catalog ids for a focused installation:

~~~bash
sddx init --platform codex --profile architecture --no-interactive
sddx init --platform claude --skills system-design --no-interactive
sddx init --platform codex --sync-platforms --no-interactive
~~~

Available profiles are sdlc, product, architecture, frontend, backend, debugging, devops, and documentation. The core SDDx workflow skills and capability router are always installed.

| Platform | Project-local skill directory |
| --- | --- |
| Codex | .agents/skills/ |
| Claude Code | .claude/skills/ |
| Cursor | .cursor/skills/ |
| GitHub Copilot | .github/skills/ |
| Windsurf | .windsurf/skills/ |
| OpenCode | .opencode/skills/ |
| Generic | .agents/skills/ |

Initialization preserves unrelated files. Interactive platform selection is synchronized: existing SDDx platforms are preselected, and deselected platforms have only their SDDx-managed skill directories removed. Commit the generated project state so another agent can resume it.

### Codex invocation

Codex discovers project skills from `.agents/skills/`. There is no separate `codex/` directory. Open `/skills` to browse the selector, or invoke the generated workflow skills directly:

~~~text
$sddx-explore
$sddx-propose
$sddx-apply
$sddx-verify
$sddx-archive
~~~

Start Codex from the project directory or one of its subdirectories. Codex scans `.agents/skills` from the current directory up to the repository root. Restart Codex after `sddx init` if the skills are not listed. The `$skill-name` form is the Codex invocation syntax. The generated agent skill directory is only an invocation/discovery surface; all durable workflow documents remain under `sddx/`.

## Project layout

~~~text
sddx/
├── config.yaml
├── config.json
├── schemas/spec-driven/
├── changes/
├── explorations/
├── specs/
├── capability-catalog.json
├── routing-manifest.yaml
└── README.md

<selected-agent-directory>/skills/
├── sddx-explore/
├── sddx-propose/
├── sddx-apply/
├── sddx-verify/
├── sddx-archive/
├── sddx-quick/
├── sddx-debug/
├── sddx-capability-router/
└── bundled capability skills/
~~~

The change directory and project metadata—not a model session—are the source of truth. Existing compatibility-layout projects may use `openspec/changes/` and `.sddx/` when their configuration was initialized that way.

## Select a workflow

### Full feature or architectural change

Use full workflow when requirements, architecture, public behavior, data, infrastructure, security, or rollout require meaningful decisions.

~~~bash
sddx new billing-export --workflow full
~~~

~~~text
explore → propose → apply → verify → archive
~~~

Typical agent handoff:

~~~text
$sddx-explore
$sddx-propose
$sddx-apply
$sddx-verify
$sddx-archive
~~~

The full change starts with exploration, decisions, and handoff artifacts. The propose workflow creates OpenSpec planning artifacts: proposal, capability delta specs, optional design, and tasks.

### Small low-risk change

Use quick workflow for isolated, reversible work such as copy changes, a small styling adjustment, or a focused test or documentation update.

~~~bash
sddx new button-copy --workflow quick
~~~

~~~text
intent → tasks → apply → verify → archive
~~~

Escalate to full workflow if the change reveals architectural impact, a migration, a security concern, infrastructure work, a public contract change, a new technology, or unclear requirements.

### Bug or incident

~~~bash
sddx new checkout-timeout --workflow debug
~~~

~~~text
reproduce → diagnose → fix → regression verify → archive
~~~

Record symptoms, reproduction, hypotheses, evidence, root cause, fix, regression coverage, and verification results.

## Inspect and hand off work

~~~bash
sddx status --path .
sddx next --path .
sddx status --path . --json
sddx next --path . --json
~~~

Persist a known stage explicitly:

~~~bash
sddx stage billing-export propose --path .
sddx stage billing-export apply --path .
sddx stage billing-export verify --path .
~~~

A different model, agent, or IDE can continue by reading the same artifacts.

## Capability routing

The catalog contains the bundled OpenSpec, ai-skills, and grill-skills snapshots. The router selects a small set for the current stage, role, risk, and technology. Normally use one primary skill and no more than three supporting skills.

~~~bash
sddx skills recommend --stage explore --role product,architect --query payments --path .
sddx skills recommend --stage propose --role architect --query event-driven --path .
sddx skills recommend --stage apply --role engineering --query typescript --path .
sddx skills recommend --stage verify --role engineering,devops --query migration --path .
sddx skills recommend --stage debug --role debugging --query timeout --path .
sddx skills recommend --stage archive --role documentation,devops --path .
~~~

| Stage | Primary families | Supporting families |
| --- | --- | --- |
| explore | grilling, discovery, research | product, UX, domain, architecture, operations |
| propose | system design, codebase design, domain modeling | specs, clean architecture, product, UX, security |
| apply | implementation, TDD, clean code | refactoring, platform, UX, documentation, release |
| verify | code review, TDD, quality | architecture, security, performance, DevOps, UX |
| debug | diagnosis, triage, reproduction | legacy code, systems, observability, regression |
| archive | handoff, documentation, release | tickets, retrospectives, spec synchronization |

OpenSpec skills requiring a separate openspec executable are bundled for reference and manual use, but excluded from automatic recommendations:

~~~bash
sddx skills recommend --stage propose --include-external --path .
~~~

Use that flag only when the external executable is installed.

## Verification and archive

verify is the single quality gate; there is no separate user-facing validate stage.

The CLI checks:

- project initialization
- required artifacts for the selected workflow
- capability delta specs for full changes unless skip_specs: true is justified
- verification evidence
- a non-pending verification result

The agent-led verification workflow also checks implementation, tests, architecture, security, performance, deployment, documentation, and operational concerns applicable to the change.

~~~bash
sddx verify --path .
sddx verify --path . --json
sddx archive billing-export --path .
~~~

Archive is blocked until verification passes. The complete change record is moved to `sddx/changes/archive/` by default.

## RFCs and architecture reviews

For cross-team, architectural, breaking, security-sensitive, infrastructure, or high-risk changes:

~~~bash
sddx rfc create billing-export --path .
~~~

The local RFC is canonical. SDDx does not publish automatically to Confluence or another provider; external publication must be configured and explicitly requested.

## Technology adoption

Create a technology brief before adopting a framework, database, cloud service, deployment system, or major library:

~~~bash
sddx tech check opensearch --change billing-export --path .
~~~

The agent should complete the brief using official documentation and routed capabilities. Record exact version, official links, licensing, security review, integration plan, alternatives, migration, rollout, rollback, and verification. Creating the brief does not approve the technology.

## Practical use cases

| Use case | Start with | Useful capabilities |
| --- | --- | --- |
| Product idea | full change | grilling, discovery, product strategy, UX |
| System design | full change | system design, DDIA, clean architecture, domain modeling |
| Feature delivery | full change | proposal/specs, implementation, TDD, review |
| Small UI or content change | quick change | UX, clean code, focused verification |
| Bug investigation | debug change | diagnosis, triage, legacy code, regression testing |
| Refactoring | full change | codebase design, refactoring, architecture, quality |
| New technology | full change plus tech check | research, security, integration, DevOps, release |
| Deployment change | full change | operations, observability, rollback, release |
| RFC or architecture review | full change plus RFC | architecture, documentation, stakeholder handoff |
| Cross-agent continuation | status and next | durable artifacts and capability routing |

During exploration, document outcome, constraints, domain language, alternatives, architecture, data, security, testing, deployment, observability, rollback, ownership, open questions, and decisions.

## Troubleshooting

### A workflow skill is missing

~~~bash
sddx init --platform <platform> --no-interactive
~~~

### Verification fails

~~~bash
sddx verify --path . --json
~~~

Then run sddx next --path . and use the recommended corrective workflow.

### The change is too large for quick workflow

Create a full change and carry the quick intent into exploration. Quick workflow is an optimization for low-risk work, not a lifecycle bypass.

### A capability recommends an unavailable command

Check the catalog entry's requiresExternalCli field. SDDx-native workflows are automatic; imported skills requiring another executable are manual unless that executable is installed.

## Maintaining the bundle

Upstream updates are manual and pinned. Review the source revision, license, skill changes, references, schemas, and templates before updating:

~~~bash
npm run catalog
npm test
npm run check
npm pack --dry-run
~~~

See [the upstream bundle audit](UPSTREAM-BUNDLE-AUDIT.md) and [third-party notices](../THIRD_PARTY_NOTICES.md).
