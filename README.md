# SDDx — Agentic SDLC for AI coding agents

> From idea to verified delivery, without losing the trail.

SDDx is a stateless, agent-neutral Spec-Driven Development toolkit for OpenAI Codex and other AI coding agents. It turns product intent into durable specifications, architecture decisions, implementation tasks, verification evidence, and delivery handoffs.

Read the [complete usage guide](docs/USAGE.md) for platform setup, workflow selection, artifact lifecycle, routed skills, practical use cases, technology checks, RFCs, and troubleshooting.

## Install

```bash
npm install -g @sung1-labs/sddx
```

Or run it once without a global install:

```bash
npx @sung1-labs/sddx init
```

Initialize a project and choose the AI-agent platforms to configure:

```bash
cd my-project
sddx init
```

For automation:

```bash
sddx init --platform codex,claude --no-interactive
```

Install a focused use-case bundle instead of every capability:

```bash
sddx init --platform codex --profile architecture --no-interactive
sddx init --platform claude --skills sddx-ai-system-design --no-interactive
```

Available profiles are `sdlc`, `product`, `architecture`, `frontend`, `backend`, `debugging`, `devops`, and `documentation`. The core SDDx workflow skills and capability router are always installed. Without `--profile` or `--skills`, initialization installs the complete bundle.

The interactive initializer asks which agent platforms to configure. You can select one, several, or `all`. SDDx writes the same portable workflow skills into each selected project-local skills directory.

## Workflow

```text
explore → propose → apply → verify → archive
```

`verify` is the single quality gate. It handles artifact structure, architecture, implementation, tests, security, operations, and deployment checks that apply to the change. Code changes cannot be archived without successful verification.

## Lightweight workflows

Small changes use:

```text
intent → tasks → apply → verify → archive
```

Debugging uses:

```text
reproduce → diagnose → fix → regression verify → archive
```

SDDx escalates lightweight work when it detects architectural, security, infrastructure, migration, public-contract, or new-technology risk.

## Stateless handoffs

SDDx stores workflow state in version-controlled project artifacts. A different model, agent, or IDE can resume work by reading the change directory and running:

```bash
sddx status
```

Every step records decisions, risks, evidence, open questions, and the recommended next workflow.

## Practical use cases

- Explore a product idea and resolve requirements before coding.
- Design a new system or service boundary.
- Add a feature to an existing codebase.
- Introduce a framework, database, or infrastructure platform.
- Fix a bug through evidence-based diagnosis and regression coverage.
- Refactor legacy code safely.
- Improve UX and accessibility.
- Plan deployment, observability, rollback, and incident response.
- Publish an RFC or architecture design to Confluence when the team needs review.

## Current CLI

```text
sddx init       Initialize SDDx and configure selected AI-agent platforms
sddx new        Create a full, quick, or debug change workspace
sddx status     Show durable project state and active changes
sddx next       Recommend the next workflow for each active change
sddx stage      Persist a change's current workflow stage
sddx verify     Run the unified quality gate
sddx archive    Archive a verified change
sddx skills     Recommend capability skills for the current stage
sddx rfc create Create a local RFC/design-document draft
sddx tech check Create a technology research brief before adoption
```

### Typical feature

```bash
sddx new billing-export
# The agent runs /sddx:explore, then /sddx:propose, /sddx:apply,
# /sddx:verify, and /sddx:archive as the artifacts become ready.
sddx next
sddx verify
sddx archive billing-export
```

For a low-risk change:

```bash
sddx new button-copy --workflow quick
```

For a production issue:

```bash
sddx new checkout-timeout --workflow debug
```

For a large feature or architectural change, create the local RFC during proposal:

```bash
sddx rfc create billing-export
```

The local document remains canonical. Publishing to Confluence is an explicit, separately configured integration step; SDDx never publishes automatically.

Before introducing a new framework, database, cloud service, or other technology:

```bash
sddx tech check opensearch --change billing-export
```

The resulting brief is the durable place to record official documentation, approved skills, licensing, security, integration decisions, alternatives, and the verification plan.

To ask the router for capabilities automatically:

```bash
sddx skills recommend --stage explore --role architect,product --query payments
```

OpenSpec skills that require a separately installed `openspec` CLI are kept available for manual use but excluded from automatic recommendations by default. Include them only when that CLI is installed:

```bash
sddx skills recommend --stage propose --include-external
```

## Project structure

SDDx preserves OpenSpec-compatible planning paths:

```text
openspec/
├── config.yaml
├── schemas/
│   └── spec-driven/
├── changes/
├── explorations/
└── specs/
```

SDDx-specific installation and routing metadata lives in `.sddx/`, including the portable capability catalog.

The project-local `.sddx/routing-manifest.yaml` records the default primary and supporting capability families for every workflow stage. The catalog then narrows those defaults using the change role, risk, and technology.

Workflow skills are copied into the selected agent directories, while capability skills are routed by role, workflow stage, and change type. They can be invoked automatically from that routing metadata or manually by an agent/user.

SDDx bundles the reviewed skill snapshots from OpenSpec, ai-skills, and grill-skills. Their source revisions and licenses are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [source-manifest.yaml](source-manifest.yaml). Run `npm run catalog` after a deliberate upstream snapshot update; updates are manual.

The current bundle contains 118 distinct upstream skill directories. Generated platform mirrors are intentionally not duplicated. `sddx-capability-router` narrows the library to the relevant skills for the active stage, while every bundled skill remains directly available for manual use. SDDx also ships the OpenSpec `spec-driven` schema, its proposal/spec/design/task templates, and offline reference documentation from all three bundled sources.

The exact bundle coverage, compatibility boundary, and manual update procedure are documented in [the upstream bundle audit](docs/UPSTREAM-BUNDLE-AUDIT.md).

For npm/GitHub positioning, topics, and release checks, see [the discoverability guide](docs/DISCOVERABILITY.md).

## License and sources

SDDx is MIT licensed. Third-party source and license information is maintained in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [source-manifest.yaml](source-manifest.yaml).
