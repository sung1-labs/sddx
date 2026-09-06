import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { initializeProject } from '../src/project.mjs';
import { createChange, nextForChange, readChange, updateChangeStage } from '../src/change.mjs';
import { createRfc, createTechnologyBrief } from '../src/artifacts.mjs';
import { evaluateProject } from '../src/verification.mjs';
import { recommendSkills } from '../src/routing.mjs';

const execFileAsync = promisify(execFile);

test('exposes conventional help and version flags', async () => {
  const bin = path.resolve('bin/sddx.js');
  const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'));
  const version = await execFileAsync(process.execPath, [bin, '--version']);
  const shortVersion = await execFileAsync(process.execPath, [bin, '-v']);
  const help = await execFileAsync(process.execPath, [bin, '--help']);
  const commandHelp = await execFileAsync(process.execPath, [bin, 'help']);

  assert.equal(version.stdout.trim(), packageJson.version);
  assert.equal(shortVersion.stdout.trim(), packageJson.version);
  assert.match(help.stdout, new RegExp(`SDDx ${packageJson.version}`));
  assert.match(help.stdout, /--version/);
  assert.equal(commandHelp.stdout, help.stdout);
});

test('initializes durable OpenSpec-compatible project state for selected platforms', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'sddx-'));
  const result = await initializeProject(projectRoot, ['generic', 'cursor']);

  assert.equal(result.created.includes('sddx/config.yaml'), true);
  assert.equal(result.created.includes('sddx/config.json'), true);
  assert.equal(result.created.includes('sddx/routing-manifest.yaml'), true);
  assert.equal(result.generatedSkills.generic.length > 110, true);
  assert.equal(result.generatedSkills.cursor.length > 0, true);

  const config = JSON.parse(await readFile(path.join(projectRoot, 'sddx/config.json'), 'utf8'));
  assert.deepEqual(config.platforms, ['generic', 'cursor']);
  assert.equal(config.workspaceDir, 'sddx');
  assert.equal((await readFile(path.join(projectRoot, 'sddx/config.json'), 'utf8')).includes('"workspaceDir": "sddx"'), true);
  assert.equal(await access(path.join(projectRoot, 'openspec')).then(() => true, () => false), false);
  const openSpecConfig = await readFile(path.join(projectRoot, 'sddx/config.yaml'), 'utf8');
  assert.match(openSpecConfig, /schema: spec-driven/);
  assert.match(openSpecConfig, /operations:/);
  assert.equal((await readFile(path.join(projectRoot, 'sddx/schemas/spec-driven/schema.yaml'), 'utf8')).includes('id: specs'), true);
  const importedOpenSpecSkill = await readFile(path.join(projectRoot, '.agents/skills/apply-change/SKILL.md'), 'utf8');
  assert.match(importedOpenSpecSkill, /^name: apply-change/m);
  assert.equal(await access(path.join(projectRoot, '.agents/skills/sddx-openspec-openspec-apply-change')).then(() => true, () => false), false);

  const explore = await readFile(path.join(projectRoot, '.agents/skills/sddx-explore/SKILL.md'), 'utf8');
  assert.match(explore, /SDDx Explore/);
  assert.match(explore, /deployment/);
  const router = await readFile(path.join(projectRoot, '.agents/skills/sddx-capability-router/SKILL.md'), 'utf8');
  assert.match(router, /capability-catalog/);
  assert.match(await readFile(path.join(projectRoot, 'sddx/routing-manifest.yaml'), 'utf8'), /grilling/);
  const catalog = JSON.parse(await readFile(path.join(projectRoot, 'sddx/capability-catalog.json'), 'utf8'));
  assert.equal(catalog.skills.length, 118);
  assert.equal(catalog.skills.some((skill) => skill.requiresExternalCli === true && skill.automatic === false), true);
  assert.equal(catalog.skills.some((skill) => skill.source === 'grill-skills' && skill.roles.includes('facilitation')), true);
  assert.equal(catalog.skills.some((skill) => skill.source === 'ai-skills' && skill.stages.includes('explore')), true);
  assert.equal(catalog.skills.some((skill) => skill.source === 'openspec' && skill.stages.includes('verify')), true);

  const recommendations = await recommendSkills(projectRoot, {
    stage: 'explore',
    roles: ['architect'],
    query: 'system design',
  });
  assert.equal(recommendations.length > 0, true);
  assert.equal(recommendations.some((skill) => skill.name === 'system-design'), true);
  assert.equal(recommendations.some((skill) => skill.requiresExternalCli), false);

  const exploreProduct = await recommendSkills(projectRoot, { stage: 'explore', roles: ['product'] });
  assert.equal(exploreProduct.some((skill) => skill.id === 'grilling'), true);

  const verifyEngineering = await recommendSkills(projectRoot, { stage: 'verify', roles: ['engineering'] });
  assert.equal(verifyEngineering.some((skill) => skill.id === 'code-review'), true);
  assert.equal(catalog.skills.some((skill) => /^sddx-(ai|grill|openspec)-/.test(skill.id)), false);
  assert.equal(catalog.skills.some((skill) => skill.path.includes('sddx-ai-')), true);
});

test('initializes focused use-case bundles while retaining core workflows', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'sddx-focused-'));
  const result = await initializeProject(projectRoot, ['generic'], { profile: 'architecture' });

  assert.equal(result.selection.mode, 'selected');
  assert.deepEqual(result.selection.profiles, ['architecture']);
  assert.equal(result.selection.skills.includes('system-design'), true);
  assert.equal(result.selection.skills.includes('codebase-design'), true);

  const catalog = JSON.parse(await readFile(path.join(projectRoot, 'sddx/capability-catalog.json'), 'utf8'));
  assert.equal(catalog.skills.length, result.selection.skills.length);
  assert.equal(catalog.skills.every((skill) => result.selection.skills.includes(skill.id)), true);
  assert.equal((await readFile(path.join(projectRoot, '.agents/skills/sddx-explore/SKILL.md'), 'utf8')).includes('SDDx Explore'), true);
  assert.equal((await readFile(path.join(projectRoot, '.agents/skills/system-design/SKILL.md'), 'utf8')).includes('system design'), true);
  assert.equal((await readFile(path.join(projectRoot, '.agents/skills/sddx-capability-router/SKILL.md'), 'utf8')).includes('capability-catalog'), true);

  const oneSkillRoot = await mkdtemp(path.join(os.tmpdir(), 'sddx-one-skill-'));
  const oneSkill = await initializeProject(oneSkillRoot, ['generic'], { skills: 'system-design' });
  assert.deepEqual(oneSkill.selection.skills, ['system-design']);
  const oneSkillCatalog = JSON.parse(await readFile(path.join(oneSkillRoot, 'sddx/capability-catalog.json'), 'utf8'));
  assert.deepEqual(oneSkillCatalog.skills.map((skill) => skill.id), ['system-design']);
});

test('supports explicit OpenSpec compatibility layout', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'sddx-openspec-layout-'));
  const result = await initializeProject(projectRoot, ['generic'], { layout: 'openspec' });

  assert.equal(result.created.includes('openspec/config.yaml'), true);
  assert.equal(result.created.includes('.sddx/config.json'), true);
  assert.equal((await readFile(path.join(projectRoot, 'openspec/config.yaml'), 'utf8')).includes('schema: spec-driven'), true);
  assert.equal((await readFile(path.join(projectRoot, '.sddx/config.json'), 'utf8')).includes('"workspaceDir": "openspec"'), true);
  assert.equal((await readFile(path.join(projectRoot, 'openspec/schemas/spec-driven/schema.yaml'), 'utf8')).includes('id: specs'), true);
});

test('creates full, quick, and debug change artifacts with next-step metadata', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'sddx-'));
  await initializeProject(projectRoot, ['generic']);

  await createChange(projectRoot, 'Payments redesign', 'full');
  await createChange(projectRoot, 'Copy tweak', 'quick');
  await createChange(projectRoot, 'Checkout timeout', 'debug');

  const full = await readChange(path.join(projectRoot, 'sddx/changes/payments-redesign'));
  const quick = await readChange(path.join(projectRoot, 'sddx/changes/copy-tweak'));
  const debug = await readChange(path.join(projectRoot, 'sddx/changes/checkout-timeout'));

  assert.equal(full.files.includes('exploration.md'), true);
  assert.equal(full.files.includes('proposal.md'), false);
  assert.equal(nextForChange(full).command, '$sddx-propose');
  assert.equal(nextForChange(quick).command, '$sddx-verify');
  assert.equal(nextForChange(debug).command, '$sddx-debug');
});

test('creates local RFC and technology-check artifacts without external publishing', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'sddx-'));
  await initializeProject(projectRoot, ['generic']);
  await createChange(projectRoot, 'Search platform', 'full');

  const rfc = await createRfc(projectRoot, 'Search platform');
  const brief = await createTechnologyBrief(projectRoot, 'OpenSearch', 'Search platform');

  assert.match(rfc, /sddx\/changes\/search-platform\/rfc\.md$/);
  assert.match(brief, /research\/technology-opensearch\.md$/);
  assert.equal((await readFile(rfc, 'utf8')).includes('## Status\nDraft'), true);
  assert.equal((await readFile(brief, 'utf8')).includes('## Status\nPending research'), true);
});

test('persists stage handoffs and requires verification evidence before completion', async () => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), 'sddx-'));
  await initializeProject(projectRoot, ['generic']);
  await createChange(projectRoot, 'Profile settings', 'full');

  const initial = await evaluateProject(projectRoot);
  assert.equal(initial.ok, false);

  const staged = await updateChangeStage(projectRoot, 'Profile settings', 'verify');
  assert.equal(staged.currentStage, 'verify');

  const changeRoot = path.join(projectRoot, 'sddx/changes/profile-settings');
  await writeFile(path.join(changeRoot, 'proposal.md'), '## Why\n\nA durable profile-settings capability is needed.\n\n## Capabilities\n\n### New Capabilities\n- profile-settings: Manage profile settings.\n', 'utf8');
  await writeFile(path.join(changeRoot, 'tasks.md'), '## 1. Implementation\n\n- [ ] 1.1 Implement and verify profile settings\n', 'utf8');
  await mkdir(path.join(changeRoot, 'specs', 'profile-settings'), { recursive: true });
  await writeFile(path.join(changeRoot, 'specs', 'profile-settings', 'spec.md'), '## Purpose\n\nProfile settings provide durable user preferences.\n\n## ADDED Requirements\n\n### Requirement: Save profile settings\nThe system SHALL save profile settings.\n\n#### Scenario: Save settings\n- **WHEN** a user saves settings\n- **THEN** the settings are retained\n', 'utf8');
  await writeFile(
    path.join(changeRoot, 'verification.md'),
    '# Verification\n\n## Evidence\n\n- Unit and integration checks passed.\n\n## Result\n\nPassed\n',
    'utf8',
  );
  const verified = await evaluateProject(projectRoot);
  assert.equal(verified.ok, true);
});
