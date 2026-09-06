---
name: sddx-debug
description: Diagnose and fix a defect through reproduction, evidence-based hypotheses, a minimal fix, regression coverage, and verification.
---

# SDDx Debug

Record symptoms, reproduction steps, expected and actual behavior, evidence, hypotheses, root cause, fix, and regression proof. Use grilling only when expected behavior or constraints are unclear.

Use `sddx-capability-router` to select grilling, research, diagnosis, codebase, testing, and observability capabilities. Start with evidence and invoke the smallest relevant set; do not automatically run unrelated product or architecture skills.

Do not jump directly to a fix. Establish a feedback loop, test one hypothesis at a time, preserve rejected hypotheses when useful, and verify the regression after the fix.

Recommended flow: reproduce → diagnose → fix → regression verify → archive.
