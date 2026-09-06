import { access, mkdir, readFile, writeFile, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { PLATFORMS } from './platforms.mjs';
import { resolveSkillSelection } from './skill-selection.mjs';

const PACKAGE_ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SKILLS_ROOT = path.join(PACKAGE_ROOT, 'skills');

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function writeIfMissing(filePath, contents) {
  if (!(await exists(filePath))) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, contents, 'utf8');
    return true;
  }
  return false;
}

function yamlScalar(value) {
  return typeof value === 'string' && /[:#\[\]{},&*!|>'"%@`]/.test(value)
    ? JSON.stringify(value)
    : String(value);
}

function renderConfig(config) {
  return [
    '# OpenSpec-compatible project configuration for SDDx',
    `schema: ${config.schema}`,
    'context: |',
    '  SDDx manages lifecycle state in project artifacts and keeps the OpenSpec artifact contract authoritative.',
    '  Use the SDDx capability router to select relevant skills by workflow stage and role.',
    'rules:',
    '  proposal:',
    '    - Record capabilities as new or modified specs, or set skip_specs only for changes with no spec-level behavior change.',
    '  tasks:',
    '    - Every task must include its verification evidence or observable completion condition.',
    'operations:',
    '  apply:',
    '    guidance:',
    '      - Update task progress and durable handoff artifacts as work advances.',
    '  archive:',
    '    guidance:',
    '      - Archive only after the SDDx verification gate passes.',
    '',
  ].join('\n');
}

async function copySkills(projectRoot, platform, selectedSkills) {
  const targetRoot = path.join(projectRoot, PLATFORMS[platform].skillsDir);
  const workflowRoot = path.join(SKILLS_ROOT, 'workflow');
  const skillNames = await readdir(workflowRoot, { withFileTypes: true });
  const copied = [];

  for (const entry of skillNames) {
    if (!entry.isDirectory()) continue;
    const source = path.join(workflowRoot, entry.name);
    const target = path.join(targetRoot, entry.name);
    await mkdir(target, { recursive: true });
    await cp(source, target, { recursive: true, force: true });
    copied.push(path.relative(projectRoot, path.join(target, 'SKILL.md')));
  }

  const capabilityRoot = path.join(SKILLS_ROOT, 'capabilities');
  const capabilityEntries = await readdir(capabilityRoot, { withFileTypes: true });
  for (const entry of capabilityEntries) {
    if (!entry.isDirectory()) continue;
    const source = path.join(capabilityRoot, entry.name);
    const target = path.join(targetRoot, entry.name);
    await mkdir(target, { recursive: true });
    await cp(source, target, { recursive: true, force: true });
    copied.push(path.relative(projectRoot, path.join(target, 'SKILL.md')));
  }

  const libraryRoot = path.join(SKILLS_ROOT, 'library');
  const sources = await readdir(libraryRoot, { withFileTypes: true });
  for (const sourceEntry of sources) {
    if (!sourceEntry.isDirectory()) continue;
    const sourceRoot = path.join(libraryRoot, sourceEntry.name);
    const librarySkills = await readdir(sourceRoot, { withFileTypes: true });
    for (const skillEntry of librarySkills) {
      if (!skillEntry.isDirectory() || (selectedSkills && !selectedSkills.has(skillEntry.name))) continue;
      const source = path.join(sourceRoot, skillEntry.name);
      const target = path.join(targetRoot, skillEntry.name);
      await mkdir(target, { recursive: true });
      await cp(source, target, { recursive: true, force: true });
      copied.push(path.relative(projectRoot, path.join(target, 'SKILL.md')));
    }
  }

  return copied;
}

export async function initializeProject(projectRoot, platforms, options = {}) {
  const absoluteRoot = path.resolve(projectRoot);
  const packageCatalog = JSON.parse(await readFile(path.join(SKILLS_ROOT, 'capabilities', 'catalog.json'), 'utf8'));
  const selection = resolveSkillSelection({
    skills: options.skills ?? '',
    profile: options.profile ?? '',
    availableSkills: packageCatalog.skills.map((skill) => skill.id),
  });
  const selectedSkillSet = selection.mode === 'all' ? null : new Set(selection.skills);
  const config = {
    version: 1,
    schema: 'spec-driven',
    platforms,
    schemaPath: 'openspec/schemas/spec-driven',
    skillRouting: 'automatic',
    externalPublishing: { confluence: 'opt-in' },
    skillScope: selection.mode,
    skillProfiles: selection.profiles,
    installedSkills: selection.skills,
  };

  await mkdir(path.join(absoluteRoot, 'openspec', 'changes'), { recursive: true });
  await mkdir(path.join(absoluteRoot, 'openspec', 'specs'), { recursive: true });
  await mkdir(path.join(absoluteRoot, 'openspec', 'explorations'), { recursive: true });
  await mkdir(path.join(absoluteRoot, 'openspec', 'schemas'), { recursive: true });
  await mkdir(path.join(absoluteRoot, '.sddx'), { recursive: true });

  const created = [];
  if (await writeIfMissing(path.join(absoluteRoot, 'openspec', 'config.yaml'), renderConfig(config))) {
    created.push('openspec/config.yaml');
  }
  const schemaSource = path.join(PACKAGE_ROOT, 'schemas', 'spec-driven');
  const schemaTarget = path.join(absoluteRoot, 'openspec', 'schemas', 'spec-driven');
  if (!(await exists(schemaTarget))) {
    await cp(schemaSource, schemaTarget, { recursive: true });
    created.push('openspec/schemas/spec-driven');
  }
  if (await writeIfMissing(path.join(absoluteRoot, '.sddx', 'config.json'), `${JSON.stringify(config, null, 2)}\n`)) {
    created.push('.sddx/config.json');
  }
  if (await writeIfMissing(
    path.join(absoluteRoot, '.sddx', 'README.md'),
    '# SDDx project state\n\nSDDx keeps workflow state in version-controlled project artifacts.\n\nRead `capability-catalog.json` and `routing-manifest.yaml` through `sddx-capability-router` to select relevant bundled skills automatically by stage, role, risk, and technology. Every catalog entry is also available for manual invocation.\n',
  )) {
    created.push('.sddx/README.md');
  }
  if (await writeIfMissing(
    path.join(absoluteRoot, '.sddx', 'capability-catalog.json'),
    `${JSON.stringify({
      ...packageCatalog,
      skills: selection.mode === 'all'
        ? packageCatalog.skills
        : packageCatalog.skills.filter((skill) => selectedSkillSet.has(skill.id)),
    }, null, 2)}\n`,
  )) {
    created.push('.sddx/capability-catalog.json');
  }
  if (await writeIfMissing(
    path.join(absoluteRoot, '.sddx', 'routing-manifest.yaml'),
    await readFile(path.join(SKILLS_ROOT, 'capabilities', 'manifest.yaml'), 'utf8'),
  )) {
    created.push('.sddx/routing-manifest.yaml');
  }

  const generatedSkills = {};
  for (const platform of platforms) {
    generatedSkills[platform] = await copySkills(absoluteRoot, platform, selectedSkillSet);
  }

  return { root: absoluteRoot, created, generatedSkills, selection };
}

export async function readProjectConfig(projectRoot) {
  const filePath = path.join(path.resolve(projectRoot), '.sddx', 'config.json');
  if (!(await exists(filePath))) return null;
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function listChanges(projectRoot) {
  const root = path.join(path.resolve(projectRoot), 'openspec', 'changes');
  if (!(await exists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory() && entry.name !== 'archive').map((entry) => entry.name).sort();
}
