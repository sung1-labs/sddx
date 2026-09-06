import { mkdir, writeFile, access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { resolveProjectLayout } from './project.mjs';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function slugify(value) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!slug) throw new Error('Change name must contain letters or numbers.');
  return slug;
}

function changeMetadata(workflow) {
  const stage = workflow === 'debug' ? 'diagnose' : workflow === 'quick' ? 'apply' : 'explore';
  return `workflow: ${workflow}\ncurrentStage: ${stage}\nverificationRequired: ${workflow !== 'docs'}\nstatus: active\n`;
}

const TEMPLATES = {
  full: {
    'exploration.md': '# Exploration\n\n## Outcome\n\n## Applicable concerns\n\n- [ ] Product and user outcome\n- [ ] UX and interaction\n- [ ] Domain and data\n- [ ] Architecture and integrations\n- [ ] Security and compliance\n- [ ] Testing and quality\n- [ ] Deployment and operations\n- [ ] Rollback and recovery\n\n## Decisions\n\n## Open questions\n',
    'decisions.md': '# Decisions\n\nRecord important decisions and rejected alternatives here.\n',
    'handoff.md': '# Handoff\n\n## Current stage\nexplore\n\n## Next recommended workflow\n$sddx-explore\n',
  },
  quick: {
    'intent.md': '# Quick Change Intent\n\n## Desired outcome\n\n## Scope\n\n## Why this is low risk\n',
    'tasks.md': '# Tasks\n\n- [ ] 1.1 Implement the smallest safe change and record verification evidence\n',
    'verification.md': '# Verification\n\n## Checks\n\n## Evidence\n\n## Result\n',
    'handoff.md': '# Handoff\n\n## Current stage\napply\n\n## Next recommended workflow\n$sddx-apply\n',
  },
  debug: {
    'bug-report.md': '# Bug Report\n\n## Symptoms\n\n## Reproduction\n\n## Expected behavior\n\n## Actual behavior\n',
    'diagnosis.md': '# Diagnosis\n\n## Evidence\n\n## Hypotheses\n\n## Root cause\n',
    'fix.md': '# Fix\n\n## Change made\n\n## Regression coverage\n',
    'verification.md': '# Verification\n\n## Regression checks\n\n## Evidence\n\n## Result\n',
    'handoff.md': '# Handoff\n\n## Current stage\ndiagnose\n\n## Next recommended workflow\n$sddx-debug\n',
  },
};

export async function createChange(projectRoot, name, workflow = 'full') {
  if (!TEMPLATES[workflow]) throw new Error(`Unknown workflow: ${workflow}. Use full, quick, or debug.`);
  const slug = slugify(name);
  const layout = await resolveProjectLayout(projectRoot);
  const changeRoot = path.join(path.resolve(projectRoot), layout.workspaceDir, 'changes', slug);
  if (await exists(changeRoot)) throw new Error(`Change already exists: ${slug}`);

  await mkdir(changeRoot, { recursive: true });
  await writeFile(
    path.join(changeRoot, '.openspec.yaml'),
    `schema: spec-driven\ncreated: ${new Date().toISOString().slice(0, 10)}\ngoal: ${JSON.stringify(name)}\n`,
    'utf8',
  );
  await writeFile(path.join(changeRoot, '.sddx.yaml'), changeMetadata(workflow), 'utf8');
  for (const [relativePath, contents] of Object.entries(TEMPLATES[workflow])) {
    await writeFile(path.join(changeRoot, relativePath), contents, 'utf8');
  }
  return { slug, workflow, changeRoot };
}

function parseMetadata(contents) {
  const values = {};
  for (const line of contents.split('\n')) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

export async function readChange(changeRoot) {
  const metadataPath = path.join(changeRoot, '.sddx.yaml');
  if (!(await exists(metadataPath))) return null;
  const metadata = parseMetadata(await readFile(metadataPath, 'utf8'));
  const files = await readdir(changeRoot, { withFileTypes: true });
  return {
    name: path.basename(changeRoot),
    root: changeRoot,
    workflow: metadata.workflow ?? 'full',
    currentStage: metadata.currentStage ?? 'unknown',
    verificationRequired: metadata.verificationRequired !== 'false',
    files: files.filter((entry) => entry.isFile()).map((entry) => entry.name).sort(),
  };
}

export async function listChangeRoots(projectRoot) {
  const layout = await resolveProjectLayout(projectRoot);
  const root = path.join(path.resolve(projectRoot), layout.workspaceDir, 'changes');
  if (!(await exists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => path.join(root, entry.name))
    .sort();
}

export async function updateChangeStage(projectRoot, name, stage) {
  const allowedStages = new Set(['explore', 'propose', 'apply', 'diagnose', 'verify', 'archive']);
  if (!allowedStages.has(stage)) throw new Error(`Unknown stage: ${stage}. Use explore, propose, apply, diagnose, verify, or archive.`);
  const slug = slugify(name);
  const layout = await resolveProjectLayout(projectRoot);
  const changeRoot = path.join(path.resolve(projectRoot), layout.workspaceDir, 'changes', slug);
  const metadataPath = path.join(changeRoot, '.sddx.yaml');
  if (!(await exists(metadataPath))) throw new Error(`Change does not exist: ${name}`);
  const metadata = await readFile(metadataPath, 'utf8');
  const updated = /^currentStage:.*$/m.test(metadata)
    ? metadata.replace(/^currentStage:.*$/m, `currentStage: ${stage}`)
    : `${metadata.trimEnd()}\ncurrentStage: ${stage}\n`;
  await writeFile(metadataPath, updated, 'utf8');
  return readChange(changeRoot);
}

export function nextForChange(change) {
  const routes = {
    explore: { command: '$sddx-propose', reason: 'turn resolved exploration into durable proposal artifacts' },
    propose: { command: '$sddx-apply', reason: 'implement the approved change' },
    apply: { command: '$sddx-verify', reason: 'run the unified quality gate' },
    diagnose: { command: '$sddx-debug', reason: 'continue evidence-based diagnosis' },
    verify: { command: '$sddx-archive', reason: 'preserve and complete the verified change' },
    archive: { command: '$sddx-explore', reason: 'start the next change' },
  };
  return routes[change.currentStage] ?? { command: 'sddx status', reason: 'inspect the current change state' };
}
