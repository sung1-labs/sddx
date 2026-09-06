import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
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
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function resolveChange(projectRoot, changeName) {
  if (!changeName) throw new Error('A change name is required.');
  const layout = await resolveProjectLayout(projectRoot);
  const changeRoot = path.join(path.resolve(projectRoot), layout.workspaceDir, 'changes', slugify(changeName));
  if (!(await exists(changeRoot))) throw new Error(`Change does not exist: ${changeName}`);
  return changeRoot;
}

export async function createRfc(projectRoot, changeName) {
  const changeRoot = await resolveChange(projectRoot, changeName);
  const rfcPath = path.join(changeRoot, 'rfc.md');
  if (!(await exists(rfcPath))) {
    await writeFile(rfcPath, `# RFC: ${path.basename(changeRoot)}\n\n## Status\nDraft\n\n## Summary\n\n## Problem\n\n## Goals / Non-Goals\n\n## Proposed Design\n\n## Alternatives Considered\n\n## Architecture and Operational Impact\n\n## Security and Compliance\n\n## Migration and Rollback\n\n## Risks\n\n## Open Questions\n\n## Decision\n`, 'utf8');
  }
  return rfcPath;
}

export async function createTechnologyBrief(projectRoot, technology, changeName) {
  const changeRoot = await resolveChange(projectRoot, changeName);
  const directory = path.join(changeRoot, 'research');
  const filename = `technology-${slugify(technology)}.md`;
  const briefPath = path.join(directory, filename);
  await mkdir(directory, { recursive: true });
  if (!(await exists(briefPath))) {
    await writeFile(briefPath, `# Technology brief: ${technology}\n\n## Status\nPending research\n\n## Version and scope\n\n## Official documentation\n\n## SDDx or approved skills\n\n## Security and licensing\n\n## Integration decisions\n\n## Risks and alternatives\n\n## Verification plan\n`, 'utf8');
  }
  return briefPath;
}

export async function readChangeConfig(changeRoot) {
  const filePath = path.join(changeRoot, '.sddx.yaml');
  if (!(await exists(filePath))) return '';
  return readFile(filePath, 'utf8');
}
