# Upstream bundle audit

This document records what SDDx packages from the reviewed upstream snapshots and how those snapshots are maintained.

## Included snapshots

| Source | Pinned commit | Included | License |
| --- | --- | ---: | --- |
| OpenSpec | `e062b9572be933564ba3899d059377dfa1393e32` | 16 skills, `spec-driven` schema, templates, reference documentation | MIT |
| ai-skills | `eade5d170b3a593c5b6ebcaca898102134aee108` | 65 canonical skills and their references | MIT |
| grill-skills | `3cca18b368ae95cdbdebbff572ccafa662551015` | 37 skills and their supporting files | MIT |

Generated platform mirrors from the ai-skills repository are not copied a second time. The canonical skill directories are enough because SDDx generates the selected platform layout during `sddx init`.

## What is bundled

- Original skill instructions and skill-local supporting files.
- OpenSpec planning schema and proposal/spec/design/task templates.
- Offline reference documentation needed to understand the included OpenSpec contract.
- Source-specific license text and the pinned source manifest.
- A generated capability catalog with source, revision, role, stage, and automatic/manual routing metadata.

## Compatibility boundary

SDDx owns the CLI and the portable workflow skills. It does not package an upstream OpenSpec executable or its repository development infrastructure. Twelve imported OpenSpec workflow skills explicitly require that external executable; they are available for manual use and are excluded from automatic recommendations unless the caller passes `--include-external`.

The SDDx-native workflow uses the bundled schema and templates directly, so an installed project does not depend on another CLI for its normal lifecycle.

## Manual update procedure

1. Review the upstream repository at the intended revision.
2. Confirm its license and inspect changes to skill instructions, references, schemas, and templates.
3. Copy only the canonical source directories and required supporting files.
4. Update `source-manifest.yaml` and the corresponding license notice.
5. Run `npm run catalog`, `npm test`, `npm run check`, and `npm pack --dry-run`.
6. Review the generated catalog and the diff before committing the snapshot update.

No upstream source is deployed automatically. Every update is a deliberate, pinned repository change.
