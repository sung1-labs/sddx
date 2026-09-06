import { access, mkdir, readFile, writeFile, cp, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { PLATFORMS } from './platforms.mjs';
import { resolveSkillSelection } from './skill-selection.mjs';
import { cleanSkillName, parseSkillFrontmatter, rewriteInstalledSkillName } from './skill-naming.mjs';

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

export async function detectInstalledPlatforms(projectRoot) {
  const absoluteRoot = path.resolve(projectRoot);
  const configured = new Set();
  for (const configPath of [
    path.join(absoluteRoot, 'sddx', 'config.json'),
    path.join(absoluteRoot, '.sddx', 'config.json'),
  ]) {
    if (!(await exists(configPath))) continue;
    try {
      const config = JSON.parse(await readFile(configPath, 'utf8'));
      for (const platform of config.platforms ?? []) {
        if (PLATFORMS[platform]) configured.add(platform);
      }
    } catch {
      // A malformed config should not prevent the interactive picker from opening.
    }
  }

  const directoryOwners = new Map();
  for (const [id, platform] of Object.entries(PLATFORMS)) {
    const owner = directoryOwners.get(platform.skillsDir) ?? [];
    owner.push(id);
    directoryOwners.set(platform.skillsDir, owner);
  }
  for (const [skillsDir, owners] of directoryOwners) {
    if (owners.some((owner) => configured.has(owner))) continue;
    if (await exists(path.join(absoluteRoot, skillsDir, 'sddx-explore', 'SKILL.md'))) {
      configured.add(owners[0]);
    }
  }

  return Object.keys(PLATFORMS).filter((platform) => configured.has(platform));
}

async function collectManagedSkillNames() {
  const workflowRoot = path.join(SKILLS_ROOT, 'workflow');
  const managed = new Set(['sddx-capability-router']);
  const legacy = new Set();
  for (const entry of await readdir(workflowRoot, { withFileTypes: true })) {
    if (entry.isDirectory()) managed.add(entry.name);
  }

  const libraryRoot = path.join(SKILLS_ROOT, 'library');
  for (const sourceEntry of await readdir(libraryRoot, { withFileTypes: true })) {
    if (!sourceEntry.isDirectory()) continue;
    const sourceRoot = path.join(libraryRoot, sourceEntry.name);
    for (const skillEntry of await readdir(sourceRoot, { withFileTypes: true })) {
      if (!skillEntry.isDirectory()) continue;
      const source = path.join(sourceRoot, skillEntry.name);
      const sourceContents = await readFile(path.join(source, 'SKILL.md'), 'utf8');
      const metadata = parseSkillFrontmatter(sourceContents);
      const installedName = cleanSkillName(sourceEntry.name, skillEntry.name, metadata.name);
      managed.add(installedName);
      if (skillEntry.name !== installedName) legacy.add(skillEntry.name);
      if (metadata.name && metadata.name !== installedName) legacy.add(metadata.name);
    }
  }
  return { managed, legacy };
}

async function removeSkillDirectories(projectRoot, platform, names) {
  const skillsRoot = path.join(path.resolve(projectRoot), PLATFORMS[platform].skillsDir);
  const removed = [];
  for (const name of names) {
    const target = path.join(skillsRoot, name);
    if (!(await exists(target))) continue;
    await rm(target, { recursive: true, force: true });
    removed.push(path.relative(path.resolve(projectRoot), target));
  }
  return removed;
}

export async function resolveProjectLayout(projectRoot, requestedLayout) {
  const absoluteRoot = path.resolve(projectRoot);
  if (requestedLayout && !['sddx', 'openspec'].includes(requestedLayout)) {
    throw new Error(`Unknown layout: ${requestedLayout}. Use sddx or openspec.`);
  }

  if (requestedLayout === 'openspec') {
    return { workspaceDir: 'openspec', metadataDir: '.sddx', legacy: true };
  }
  if (requestedLayout === 'sddx') {
    return { workspaceDir: 'sddx', metadataDir: 'sddx', legacy: false };
  }

  const modernConfig = path.join(absoluteRoot, 'sddx', 'config.json');
  if (await exists(modernConfig)) return { workspaceDir: 'sddx', metadataDir: 'sddx', legacy: false };

  const legacyConfig = path.join(absoluteRoot, '.sddx', 'config.json');
  if (await exists(legacyConfig)) {
    const config = JSON.parse(await readFile(legacyConfig, 'utf8'));
    if (config.workspaceDir === 'sddx') return { workspaceDir: 'sddx', metadataDir: 'sddx', legacy: false };
    return { workspaceDir: 'openspec', metadataDir: '.sddx', legacy: true };
  }

  if (await exists(path.join(absoluteRoot, 'openspec', 'config.yaml'))) {
    return { workspaceDir: 'openspec', metadataDir: '.sddx', legacy: true };
  }
  return { workspaceDir: 'sddx', metadataDir: 'sddx', legacy: false };
}

async function writeIfMissing(filePath, contents) {
  if (!(await exists(filePath))) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, contents, 'utf8');
    return true;
  }
  return false;
}

async function writeIfChanged(filePath, contents) {
  const previous = await readFile(filePath, 'utf8').catch(() => null);
  if (previous === contents) return false;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
  return true;
}

function yamlScalar(value) {
  return typeof value === 'string' && /[:#\[\]{},&*!|>'"%@`]/.test(value)
    ? JSON.stringify(value)
    : String(value);
}

function renderConfig(config) {
  return [
    '# SDDx project configuration with an OpenSpec-compatible artifact contract',
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
      if (!skillEntry.isDirectory()) continue;
      const source = path.join(sourceRoot, skillEntry.name);
      const sourceSkill = path.join(source, 'SKILL.md');
      const sourceContents = await readFile(sourceSkill, 'utf8');
      const metadata = parseSkillFrontmatter(sourceContents);
      const installedName = cleanSkillName(sourceEntry.name, skillEntry.name, metadata.name);
      if (selectedSkills && !selectedSkills.has(installedName)) continue;
      const target = path.join(targetRoot, installedName);
      await mkdir(target, { recursive: true });
      await cp(source, target, { recursive: true, force: true });
      if (installedName !== metadata.name) {
        await writeFile(path.join(target, 'SKILL.md'), rewriteInstalledSkillName(sourceContents, installedName), 'utf8');
      }
      copied.push(path.relative(projectRoot, path.join(target, 'SKILL.md')));
    }
  }

  return copied;
}

export async function initializeProject(projectRoot, platforms, options = {}) {
  const absoluteRoot = path.resolve(projectRoot);
  const layout = await resolveProjectLayout(absoluteRoot, options.layout);
  const workspaceRoot = path.join(absoluteRoot, layout.workspaceDir);
  const metadataRoot = path.join(absoluteRoot, layout.metadataDir);
  const packageCatalog = JSON.parse(await readFile(path.join(SKILLS_ROOT, 'capabilities', 'catalog.json'), 'utf8'));
  const existingConfigPath = path.join(metadataRoot, 'config.json');
  const existingConfig = await readFile(existingConfigPath, 'utf8')
    .then((contents) => JSON.parse(contents))
    .catch(() => null);
  const configuredPlatforms = options.syncPlatforms
    ? [...new Set(platforms)]
    : [...new Set([...(existingConfig?.platforms ?? []).filter((platform) => PLATFORMS[platform]), ...platforms])];
  const selection = resolveSkillSelection({
    skills: options.skills ?? '',
    profile: options.profile ?? '',
    availableSkills: packageCatalog.skills.map((skill) => skill.id),
  });
  const selectedSkillSet = selection.mode === 'all' ? null : new Set(selection.skills);
  const config = {
    ...existingConfig,
    version: 1,
    schema: 'spec-driven',
    workspaceDir: layout.workspaceDir,
    platforms: configuredPlatforms,
    schemaPath: `${layout.workspaceDir}/schemas/spec-driven`,
    skillRouting: 'automatic',
    externalPublishing: { confluence: 'opt-in' },
    skillScope: selection.mode,
    skillProfiles: selection.profiles,
    installedSkills: selection.skills,
  };

  await mkdir(path.join(workspaceRoot, 'changes'), { recursive: true });
  await mkdir(path.join(workspaceRoot, 'specs'), { recursive: true });
  await mkdir(path.join(workspaceRoot, 'explorations'), { recursive: true });
  await mkdir(path.join(workspaceRoot, 'schemas'), { recursive: true });
  await mkdir(metadataRoot, { recursive: true });

  const created = [];
  const updated = [];
  const removed = [];
  const managedNames = await collectManagedSkillNames();
  for (const platform of Object.keys(PLATFORMS)) {
    if (configuredPlatforms.includes(platform)) {
      removed.push(...await removeSkillDirectories(absoluteRoot, platform, managedNames.legacy));
    } else if (options.syncPlatforms) {
      removed.push(...await removeSkillDirectories(absoluteRoot, platform, managedNames.managed));
    }
  }
  if (await writeIfMissing(path.join(workspaceRoot, 'config.yaml'), renderConfig(config))) {
    created.push(path.join(layout.workspaceDir, 'config.yaml'));
  }
  const schemaSource = path.join(PACKAGE_ROOT, 'schemas', 'spec-driven');
  const schemaTarget = path.join(workspaceRoot, 'schemas', 'spec-driven');
  if (!(await exists(schemaTarget))) {
    await cp(schemaSource, schemaTarget, { recursive: true });
    created.push(path.join(layout.workspaceDir, 'schemas/spec-driven'));
  }
  if (await writeIfMissing(path.join(metadataRoot, 'config.json'), `${JSON.stringify(config, null, 2)}\n`)) {
    created.push(path.join(layout.metadataDir, 'config.json'));
  } else if (await writeIfChanged(path.join(metadataRoot, 'config.json'), `${JSON.stringify(config, null, 2)}\n`)) {
    updated.push(path.join(layout.metadataDir, 'config.json'));
  }
  if (await writeIfMissing(
    path.join(metadataRoot, 'README.md'),
    '# SDDx project workspace\n\nSDDx keeps workflow state in version-controlled project artifacts. The default workspace is `sddx/`; its schema and change records follow the OpenSpec artifact contract without requiring an `openspec/` directory.\n\nRead `capability-catalog.json` and `routing-manifest.yaml` through `sddx-capability-router` to select relevant bundled skills automatically by stage, role, risk, and technology. Every catalog entry is also available for manual invocation.\n',
  )) {
    created.push(path.join(layout.metadataDir, 'README.md'));
  }
  if (await writeIfMissing(
    path.join(metadataRoot, 'capability-catalog.json'),
    `${JSON.stringify({
      ...packageCatalog,
      skills: selection.mode === 'all'
        ? packageCatalog.skills
        : packageCatalog.skills.filter((skill) => selectedSkillSet.has(skill.id)),
    }, null, 2)}\n`,
  )) {
    created.push(path.join(layout.metadataDir, 'capability-catalog.json'));
  }
  if (await writeIfMissing(
    path.join(metadataRoot, 'routing-manifest.yaml'),
    await readFile(path.join(SKILLS_ROOT, 'capabilities', 'manifest.yaml'), 'utf8'),
  )) {
    created.push(path.join(layout.metadataDir, 'routing-manifest.yaml'));
  }

  const generatedSkills = {};
  for (const platform of platforms) {
    generatedSkills[platform] = await copySkills(absoluteRoot, platform, selectedSkillSet);
  }

  return {
    root: absoluteRoot,
    workspaceDir: layout.workspaceDir,
    created,
    updated,
    removed,
    generatedSkills,
    selection,
    platforms: configuredPlatforms,
  };
}

export async function readProjectConfig(projectRoot) {
  const layout = await resolveProjectLayout(projectRoot);
  const filePath = path.join(path.resolve(projectRoot), layout.metadataDir, 'config.json');
  if (!(await exists(filePath))) return null;
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function listChanges(projectRoot) {
  const layout = await resolveProjectLayout(projectRoot);
  const root = path.join(path.resolve(projectRoot), layout.workspaceDir, 'changes');
  if (!(await exists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory() && entry.name !== 'archive').map((entry) => entry.name).sort();
}
