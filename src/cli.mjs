import { createInterface } from 'node:readline/promises';
import { mkdir, rename } from 'node:fs/promises';
import process from 'node:process';
import { initializeProject, listChanges, readProjectConfig } from './project.mjs';
import { formatPlatformChoices, parsePlatformList, PLATFORMS } from './platforms.mjs';
import { createChange, listChangeRoots, nextForChange, readChange, updateChangeStage } from './change.mjs';
import { createRfc, createTechnologyBrief } from './artifacts.mjs';
import { evaluateProject } from './verification.mjs';
import { recommendSkills } from './routing.mjs';

function optionValue(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function hasFlag(args, name) {
  return args.includes(name);
}

function positionalArgs(args, valueOptions = []) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (valueOptions.includes(argument)) {
      index += 1;
      continue;
    }
    if (!argument.startsWith('-')) values.push(argument);
  }
  return values;
}

async function askForPlatforms() {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log('Which AI-agent platforms should SDDx configure?');
    console.log(formatPlatformChoices());
    const answer = await readline.question('Choose one or more numbers, or type "all": ');
    if (answer.trim().toLowerCase() === 'all') return Object.keys(PLATFORMS);
    const choices = answer.split(',').map((item) => Number.parseInt(item.trim(), 10));
    const names = choices.filter(Number.isInteger).map((choice) => Object.keys(PLATFORMS)[choice - 1]).filter(Boolean);
    if (names.length === 0) throw new Error('Select at least one platform.');
    return names;
  } finally {
    readline.close();
  }
}

async function initCommand(args) {
  const projectRoot = positionalArgs(args, ['--platform', '--skills', '--profile', '--use-case'])[0] ?? '.';
  const explicitPlatforms = optionValue(args, '--platform');
  const skills = optionValue(args, '--skills') ?? '';
  const profile = optionValue(args, '--profile') ?? optionValue(args, '--use-case') ?? '';
  let platforms;

  if (explicitPlatforms) {
    platforms = explicitPlatforms.toLowerCase() === 'all' ? Object.keys(PLATFORMS) : parsePlatformList(explicitPlatforms);
  } else if (hasFlag(args, '--no-interactive')) {
    throw new Error('Non-interactive init requires --platform <names> or --platform all.');
  } else {
    platforms = await askForPlatforms();
  }

  const result = await initializeProject(projectRoot, platforms, { skills, profile });
  console.log(`Initialized SDDx in ${result.root}`);
  console.log(`Platforms: ${platforms.map((platform) => PLATFORMS[platform].label).join(', ')}`);
  console.log(`Skill scope: ${result.selection.mode}${result.selection.profiles.length > 0 ? ` (${result.selection.profiles.join(', ')})` : ''}`);
  console.log(`Capabilities installed: ${result.selection.skills.length}`);
  if (result.created.length > 0) console.log(`Created: ${result.created.join(', ')}`);
  console.log('Generated workflow skills for each selected platform.');
  console.log('Next recommended step: /sddx:explore');
}

async function statusCommand(args) {
  const projectRoot = optionValue(args, '--path') ?? positionalArgs(args, ['--path'])[0] ?? '.';
  const config = await readProjectConfig(projectRoot);
  const changes = await listChanges(projectRoot);
  const details = [];
  for (const root of await listChangeRoots(projectRoot)) {
    const change = await readChange(root);
    if (change) details.push({ ...change, next: nextForChange(change) });
  }
  const result = { projectRoot, initialized: Boolean(config), platforms: config?.platforms ?? [], changes, details };
  if (hasFlag(args, '--json')) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`SDDx initialized: ${result.initialized ? 'yes' : 'no'}`);
  console.log(`Platforms: ${result.platforms.length > 0 ? result.platforms.join(', ') : 'none'}`);
  console.log(`Active changes: ${result.changes.length > 0 ? result.changes.join(', ') : 'none'}`);
  for (const change of details) console.log(`Next for ${change.name}: ${change.next.command} (${change.next.reason})`);
  if (details.length === 0) console.log('Next recommended step: /sddx:explore');
}

async function newCommand(args) {
  const workflow = optionValue(args, '--workflow') ?? 'full';
  const name = positionalArgs(args, ['--workflow', '--path'])[0];
  const projectRoot = optionValue(args, '--path') ?? '.';
  if (!name) throw new Error('Usage: sddx new <change-name> [--workflow full|quick|debug] [--path <project>]');
  const result = await createChange(projectRoot, name, workflow);
  console.log(`Created ${result.workflow} change: ${result.slug}`);
  console.log(`Location: ${result.changeRoot}`);
  console.log(`Next recommended step: ${result.workflow === 'debug' ? '/sddx:debug' : result.workflow === 'quick' ? '/sddx:apply' : '/sddx:explore'}`);
}

async function nextCommand(args) {
  const projectRoot = optionValue(args, '--path') ?? positionalArgs(args, ['--path'])[0] ?? '.';
  const roots = await listChangeRoots(projectRoot);
  const recommendations = [];
  for (const root of roots) {
    const change = await readChange(root);
    if (change) recommendations.push({ change: change.name, ...nextForChange(change) });
  }
  if (hasFlag(args, '--json')) {
    console.log(JSON.stringify({ recommendations }, null, 2));
    return;
  }
  if (recommendations.length === 0) {
    console.log('Next recommended step: /sddx:explore');
    return;
  }
  for (const item of recommendations) console.log(`${item.change}: ${item.command} — ${item.reason}`);
}

async function verifyCommand(args) {
  const projectRoot = optionValue(args, '--path') ?? positionalArgs(args, ['--path'])[0] ?? '.';
  const result = await evaluateProject(projectRoot);
  if (hasFlag(args, '--json')) {
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    return;
  }
  console.log('SDDx verification');
  for (const check of result.checks) console.log(`${check.passed ? '✓' : '✗'} ${check.name}`);
  console.log(result.ok ? 'Verification passed.' : 'Verification failed.');
  if (!result.ok) process.exitCode = 1;
}

async function stageCommand(args) {
  const projectRoot = optionValue(args, '--path') ?? '.';
  const positional = args.filter((arg, index) => !arg.startsWith('-') && args[index - 1] !== '--path');
  const [name, stage] = positional;
  if (!name || !stage) throw new Error('Usage: sddx stage <change-name> <stage> [--path <project>]');
  const change = await updateChangeStage(projectRoot, name, stage);
  console.log(`Updated ${change.name} to stage: ${change.currentStage}`);
  console.log(`Next recommended step: ${nextForChange(change).command}`);
}

async function archiveCommand(args) {
  const projectRoot = optionValue(args, '--path') ?? '.';
  const changeName = args.find((arg, index) => index === 0 && !arg.startsWith('-'));
  if (!changeName) throw new Error('Usage: sddx archive <change-name> [--path <project>]');
  const result = await evaluateProject(projectRoot);
  const detail = result.changeDetails.find((item) => item.name === changeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  if (!detail || !detail.passed) throw new Error(`Change ${changeName} is not verified. Run sddx verify and resolve all failures first.`);
  const changeRoot = (await listChangeRoots(projectRoot)).find((root) => root.endsWith(`/${detail.name}`));
  const archiveRoot = `${projectRoot.replace(/\/$/, '')}/openspec/changes/archive`;
  await mkdir(archiveRoot, { recursive: true });
  const destination = `${archiveRoot}/${detail.name}`;
  await rename(changeRoot, destination);
  console.log(`Archived verified change: ${detail.name}`);
  console.log('Next recommended step: /sddx:explore');
}

async function rfcCommand(args) {
  const action = args[0];
  const projectRoot = optionValue(args, '--path') ?? '.';
  const changeName = args.find((arg, index) => index > 0 && !arg.startsWith('-') && arg !== optionValue(args, '--path'));
  if (action !== 'create' || !changeName) throw new Error('Usage: sddx rfc create <change-name> [--path <project>]');
  const filePath = await createRfc(projectRoot, changeName);
  console.log(`Created RFC draft: ${filePath}`);
  console.log('Publishing is opt-in and requires a configured external provider.');
}

async function techCommand(args) {
  const action = args[0];
  const technology = args[1];
  const projectRoot = optionValue(args, '--path') ?? '.';
  const changeName = optionValue(args, '--change');
  if (action !== 'check' || !technology || !changeName) {
    throw new Error('Usage: sddx tech check <technology> --change <change-name> [--path <project>]');
  }
  const filePath = await createTechnologyBrief(projectRoot, technology, changeName);
  console.log(`Created technology brief: ${filePath}`);
  console.log('Next: research official documentation and approved SDDx skills before implementation.');
}

async function skillsCommand(args) {
  const action = args[0];
  const projectRoot = optionValue(args, '--path') ?? '.';
  const stage = optionValue(args, '--stage');
  const roles = (optionValue(args, '--role') ?? '').split(',');
  const query = optionValue(args, '--query') ?? '';
  if (action !== 'recommend' || !stage) {
    throw new Error('Usage: sddx skills recommend --stage <stage> [--role <roles>] [--query <terms>] [--path <project>]');
  }
  const includeExternal = hasFlag(args, '--include-external');
  const recommendations = await recommendSkills(projectRoot, {
    stage,
    roles,
    query,
    includeExternal,
  });
  if (hasFlag(args, '--json')) {
    console.log(JSON.stringify({ stage, roles: roles.filter(Boolean), query, includeExternal, recommendations }, null, 2));
    return;
  }
  console.log(`Recommended capabilities for ${stage}${includeExternal ? ' (including external CLI skills)' : ''}:`);
  for (const skill of recommendations) console.log(`- ${skill.id} (${skill.roles.join(', ')}) — ${skill.path}`);
  if (recommendations.length === 0) console.log('No matching capabilities found. Use the catalog for manual selection.');
}

function help() {
  console.log(`SDDx — Spec-Driven Development for AI-assisted engineering

Usage:
  sddx init [path] [--platform <names>] [--profile <name>] [--skills <ids>] [--no-interactive]
  sddx new <change-name> [--workflow full|quick|debug] [--path <project>]
  sddx status [path] [--path <project>] [--json]
  sddx next [path] [--path <project>] [--json]
  sddx stage <change-name> <stage> [--path <project>]
  sddx verify [path] [--path <project>] [--json]
  sddx archive <change-name> [--path <project>]
  sddx rfc create <change-name> [--path <project>]
  sddx tech check <technology> --change <change-name> [--path <project>]
  sddx skills recommend --stage <stage> [--role <roles>] [--query <terms>] [--include-external] [--path <project>]

Platforms:
  ${Object.entries(PLATFORMS).map(([id, platform]) => `${id} = ${platform.label}`).join('\n  ')}

Skill profiles:
  sdlc, product, architecture, frontend, backend, debugging, devops, documentation
`);
}

export async function main(args) {
  const [command = 'help'] = args;
  if (command === 'init') return initCommand(args.slice(1));
  if (command === 'new') return newCommand(args.slice(1));
  if (command === 'status') return statusCommand(args.slice(1));
  if (command === 'next') return nextCommand(args.slice(1));
  if (command === 'stage') return stageCommand(args.slice(1));
  if (command === 'verify') return verifyCommand(args.slice(1));
  if (command === 'archive') return archiveCommand(args.slice(1));
  if (command === 'rfc') return rfcCommand(args.slice(1));
  if (command === 'tech') return techCommand(args.slice(1));
  if (command === 'skills') return skillsCommand(args.slice(1));
  help();
}
