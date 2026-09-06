# SDDx Skills

SDDx has two layers of skills:

For installation and practical workflow examples, see [the usage guide](../docs/USAGE.md).

- Workflow skills own the lifecycle: explore, propose, apply, verify, archive, quick changes, and debugging.
- Capability skills provide product, architecture, UX, engineering, quality, DevOps, security, and documentation expertise.

Workflow skills are user-facing. Capability skills can be selected automatically from the current workflow stage, change type, risk, and technology, or invoked manually.

The bundled capability library contains the reviewed skill snapshots from OpenSpec, ai-skills, and grill-skills. Use [capabilities/catalog.json](capabilities/catalog.json) to select skills by role and stage. Upstream revisions are pinned and updates are manual through `npm run catalog` after a reviewed snapshot update.

The complete library is installed into each selected agent platform during `sddx init`. SDDx invokes only relevant capabilities automatically to protect context and consistency; every bundled skill remains available for direct manual use.
