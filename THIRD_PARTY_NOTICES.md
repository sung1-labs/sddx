# Third-party notices

SDDx v0.1 contains an original workflow and CLI foundation plus curated snapshots of 118 distinct skill directories:

- 16 OpenSpec skills
- 65 ai-skills skills
- 37 grill-skills skills

The imported skill content remains available under `skills/library/`, with supporting source documentation under `docs/ai-skills/` and `docs/grill-skills/`. OpenSpec schemas and templates are under `schemas/`, and OpenSpec reference documentation is under `docs/openspec/` and `docs/openspec-lab/`. Source-specific MIT license text is included in the corresponding source directories. The pinned revisions are recorded in `source-manifest.yaml` and `skills/capabilities/catalog.json`.

## Upstream license records

| Source | Copyright notice | License record |
| --- | --- | --- |
| OpenSpec | Copyright (c) 2024 OpenSpec Contributors | `third-party/openspec/LICENSE`, `skills/library/openspec/UPSTREAM-LICENSE.txt` |
| ai-skills | Copyright (c) 2025 Wondel.ai sp. z o.o. | `skills/library/ai-skills/UPSTREAM-LICENSE.txt`, `docs/ai-skills/UPSTREAM-LICENSE.txt` |
| grill-skills | Copyright (c) 2026 Matt Pocock | `skills/library/grill-skills/UPSTREAM-LICENSE.txt`, `docs/grill-skills/UPSTREAM-LICENSE.txt` |

These records are included in the published npm package. SDDx's own original CLI, workflow, routing, and integration code is covered by the root `LICENSE`.

Directory names are SDDx installation identifiers; the imported skill content and frontmatter are preserved. Updates are manual and reviewable; there is no automatic upstream deployment. Any future adaptation must retain its upstream attribution and license requirements.
