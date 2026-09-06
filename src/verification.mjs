import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { listChanges, readProjectConfig } from './project.mjs';
import { listChangeRoots, readChange } from './change.mjs';

async function markdownFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await markdownFiles(entryPath));
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(entryPath);
    }
    return files;
  } catch {
    return [];
  }
}

export async function evaluateProject(projectRoot) {
  const resolvedRoot = path.resolve(projectRoot);
  const config = await readProjectConfig(resolvedRoot);
  const changes = await listChanges(resolvedRoot);
  const changeDetails = [];

  for (const root of await listChangeRoots(resolvedRoot)) {
    const change = await readChange(root);
    if (!change) continue;
    const required = change.workflow === 'full'
      ? ['proposal.md', 'tasks.md', 'verification.md', 'handoff.md']
      : ['verification.md', 'handoff.md'];
    const missing = required.filter((file) => !change.files.includes(file));
    const openSpecMetadata = await readFile(path.join(change.root, '.openspec.yaml'), 'utf8').catch(() => '');
    const skipSpecs = /^skip_specs:\s*true\s*$/m.test(openSpecMetadata);
    const specMissing = change.workflow === 'full' && !skipSpecs && (await markdownFiles(path.join(change.root, 'specs'))).length === 0;
    let evidenceMissing = false;
    let pending = false;
    if (change.files.includes('verification.md')) {
      const verification = await readFile(path.join(change.root, 'verification.md'), 'utf8');
      const evidenceSection = verification.split(/^## Evidence\s*$/m)[1]?.split(/^## Result\s*$/m)[0]?.trim() ?? '';
      const resultSection = verification.split(/^## Result\s*$/m)[1]?.trim() ?? '';
      evidenceMissing = evidenceSection.length === 0;
      pending = /\bpending\b/i.test(resultSection);
    }
    changeDetails.push({
      name: change.name,
      workflow: change.workflow,
      missing,
      specMissing,
      evidenceMissing,
      pending,
      passed: missing.length === 0 && !specMissing && !evidenceMissing && !pending,
    });
  }

  const checks = [
    { name: 'project initialized', passed: Boolean(config) },
    { name: 'workflow artifact root exists', passed: Boolean(config) },
    ...changeDetails.map((change) => ({
      name: `change ${change.name} has its verification inputs`,
      passed: change.passed,
      missing: change.missing,
      specMissing: change.specMissing,
      evidenceMissing: change.evidenceMissing,
      pending: change.pending,
    })),
  ];

  return { ok: checks.every((check) => check.passed), checks, changes, changeDetails };
}
