import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const libraryRoot = path.join(root, 'skills', 'library');
const catalogPath = path.join(root, 'skills', 'capabilities', 'catalog.json');

const sources = {
  openspec: { commit: 'e062b9572be933564ba3899d059377dfa1393e32' },
  'ai-skills': { commit: 'eade5d170b3a593c5b6ebcaca898102134aee108' },
  'grill-skills': { commit: '3cca18b368ae95cdbdebbff572ccafa662551015' },
};

async function findSkills(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await findSkills(entryPath));
    else if (entry.isFile() && entry.name === 'SKILL.md') result.push(entryPath);
  }
  return result;
}

function frontmatter(contents) {
  const match = contents.match(/^---\n([\s\S]*?)\n---/);
  const values = {};
  for (const line of match?.[1]?.split('\n') ?? []) {
    const item = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (item) values[item[1]] = item[2].replace(/^['"]|['"]$/g, '');
  }
  return values;
}

const ROLE_RULES = [
  ['product', /37signals|blue-ocean|cold-start|continuous-discovery|create-business|grow-business|inspired-product|jobs-to-be-done|lean-startup|mom-test|monetizing|obviously-awesome|one-page-marketing|predictable-revenue|scorecard-marketing|storybrand|traction|good-strategy|hundred-million-offers|negotiation|contagious|crossing-the-chasm|drive-motivation|high-output-management|grill-me|productivity-grilling|grill-with-docs/],
  ['ux', /conversion|cro-methodology|design-everyday|design-sprint|hooked-ux|ios-hig|lean-ux|microinteraction|refactoring-ui|steve-jobs-design-review|top-design|ux-heuristics|web-typography|create-website|grow-website|improve-website|improve-app/],
  ['architect', /architecture|system-design|ddia|domain-driven|clean-architecture|design-code-architecture|software-design-philosophy|team-topologies|codebase-design|improve-codebase-architecture|wayfinder|domain-modeling|high-perf-browser|working-with-legacy/],
  ['engineering', /clean-code|pragmatic-programmer|refactoring|technical-debt|improve-code-quality|implement|tdd|code-review|prototype|scaffold-exercises|merge-conflicts|shoehorn|apply-change/],
  ['debugging', /diagnos|debug|triage|incident|working-with-legacy|high-perf-browser|loop-me/],
  ['devops', /release-it|release|pre-commit|git-guardrails|setup-ts-deep-modules|deploy|infra|operation|archive|sync-specs/],
  ['security', /security|auth|privacy|threat|compliance/],
  ['documentation', /document|docs|writing|handoff|ticket|to-spec|technical-documentation|retro/],
  ['research', /research|wayfinder|wizard|ask-matt|technology/],
  ['facilitation', /grill|question|teach|wait-what|ask-matt|research|facilitat/],
];

const STAGE_FOCUS = {
  explore: /grill-me|productivity-grilling|grill-with-docs|engineering-research|research|continuous-discovery|mom-test|inspired-product|jobs-to-be-done|system-design|domain-driven|design-sprint|design-everyday|lean-ux|codebase-design|wayfinder|wizard|architecture-optimization|openspec-explore|openspec-onboard|openspec-new-change/,
  propose: /to-spec|domain-modeling|codebase-design|system-design|clean-architecture|design-code-architecture|architecture-optimization|technical-documentation|openspec-propose|openspec-continue|openspec-update|openspec-ff-change/,
  apply: /implement|tdd|clean-code|pragmatic-programmer|refactoring|prototype|improve-code-quality|remove-technical-debt|release-it|pre-commit|setup-ts-deep-modules|openspec-apply/,
  verify: /code-review|tdd|improve-code-quality|clean-code|architecture-optimization|release-it|ux-heuristics|technical-documentation|diagnos|triage|openspec-verify|verify-openspec-docs/,
  debug: /diagnos|triage|working-with-legacy|high-perf-browser|ddia-systems|research|grill|debug|openspec-explore/,
  archive: /handoff|retro|technical-documentation|release-it|to-tickets|sync-specs|archive|release-openspec/,
};

function route(source, identifier, description) {
  const slug = identifier.toLowerCase();
  const text = `${slug} ${source === 'openspec' ? description : ''}`;
  const roles = new Set();
  const stages = new Set();
  const priority = {};

  if (source === 'openspec') {
    roles.add('lifecycle');
    if (/explore|onboard|new-change|continue|update|ff-change/.test(slug)) stages.add('explore');
    if (/propose/.test(slug)) stages.add('propose');
    if (/apply/.test(slug)) stages.add('apply');
    if (/verify/.test(slug)) stages.add('verify');
    if (/archive|sync-specs/.test(slug)) stages.add('archive');
  }

  for (const [role, pattern] of ROLE_RULES) {
    if (pattern.test(text)) roles.add(role);
  }

  if (source === 'grill-skills') roles.add('facilitation');
  if (roles.size === 0) roles.add(source === 'grill-skills' ? 'facilitation' : 'engineering');

  if (roles.has('product') || roles.has('facilitation') || roles.has('research') || roles.has('architect') || roles.has('ux')) stages.add('explore');
  if (roles.has('product') || roles.has('architect') || roles.has('ux') || roles.has('security') || roles.has('documentation')) stages.add('propose');
  if (roles.has('engineering') || roles.has('devops') || roles.has('ux') || roles.has('documentation')) stages.add('apply');
  if (roles.has('engineering') || roles.has('architect') || roles.has('devops') || roles.has('debugging') || roles.has('security') || roles.has('ux') || roles.has('documentation')) stages.add('verify');
  if (roles.has('debugging')) stages.add('debug');
  if (roles.has('documentation') || roles.has('devops')) stages.add('archive');

  for (const [stage, pattern] of Object.entries(STAGE_FOCUS)) {
    if (pattern.test(slug)) priority[stage] = 40;
  }

  if (stages.size === 0) stages.add('explore');
  return { roles: [...roles].sort(), stages: [...stages].sort(), priority };
}

const skills = [];
for (const source of Object.keys(sources)) {
  const sourceRoot = path.join(libraryRoot, source);
  for (const filePath of await findSkills(sourceRoot)) {
    const relativePath = path.relative(root, filePath);
    const contents = await readFile(filePath, 'utf8');
    const metadata = frontmatter(contents);
    const identifier = path.basename(path.dirname(filePath));
    const routing = route(source, identifier, metadata.description ?? '');
    const requiresExternalCli = /requires\s+openspec\s+cli/i.test(metadata.compatibility ?? '');
    skills.push({
      id: identifier,
      name: metadata.name ?? identifier,
      description: metadata.description ?? '',
      source,
      commit: sources[source].commit,
      path: relativePath,
      requiresExternalCli,
      automatic: !requiresExternalCli,
      manual: true,
      ...routing,
    });
  }
}

skills.sort((left, right) => left.id.localeCompare(right.id));
await mkdir(path.dirname(catalogPath), { recursive: true });
await writeFile(catalogPath, `${JSON.stringify({ version: 1, generatedAt: 'manual-build', skills }, null, 2)}\n`, 'utf8');
console.log(`Generated ${skills.length} capability skill entries.`);
