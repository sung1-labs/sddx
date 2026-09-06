---
name: sddx-archive
description: Complete a verified SDDx change, preserve its durable record, synchronize specifications, and recommend the next workflow.
---

# SDDx Archive

Read status, tasks, decisions, verification evidence, and any RFC publication state before archiving. Do not archive a code change without successful verification. Preserve the complete change record and update canonical specifications when required.

Use `sddx-capability-router` for documentation, release, operational handoff, and specification-synchronization capabilities that apply to the completed change. Preserve upstream source attribution in the durable record when an imported capability materially affected the work.

If an RFC or design document was published, retain its provider, page identifier, URL, and synchronization status locally. Produce a concise archive summary and recommend the next workflow, such as a follow-up change, release preparation, or retrospective.

Use `sddx archive <change-name>` only after verification has passed. The CLI moves the complete durable record into `openspec/changes/archive/`.
