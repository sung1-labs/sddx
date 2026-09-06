export const SKILL_PROFILES = {
  sdlc: [
    'sddx-grill-productivity-grilling',
    'sddx-grill-engineering-research',
    'sddx-ai-continuous-discovery',
    'sddx-ai-system-design',
    'sddx-ai-clean-architecture',
    'sddx-ai-domain-driven-design',
    'sddx-grill-engineering-to-spec',
    'sddx-grill-engineering-implement',
    'sddx-grill-engineering-tdd',
    'sddx-ai-clean-code',
    'sddx-grill-engineering-code-review',
    'sddx-grill-engineering-diagnosing-bugs',
    'sddx-grill-engineering-triage',
    'sddx-ai-release-it',
    'sddx-ai-technical-documentation',
  ],
  product: [
    'sddx-grill-productivity-grilling',
    'sddx-grill-engineering-research',
    'sddx-ai-continuous-discovery',
    'sddx-ai-inspired-product',
    'sddx-ai-jobs-to-be-done',
    'sddx-ai-mom-test',
    'sddx-ai-lean-ux',
  ],
  architecture: [
    'sddx-ai-system-design',
    'sddx-ai-ddia-systems',
    'sddx-ai-clean-architecture',
    'sddx-ai-domain-driven-design',
    'sddx-ai-design-code-architecture',
    'sddx-grill-engineering-codebase-design',
    'sddx-grill-engineering-domain-modeling',
  ],
  frontend: [
    'sddx-ai-design-everyday-things',
    'sddx-ai-design-sprint',
    'sddx-ai-ios-hig-design',
    'sddx-ai-microinteractions',
    'sddx-ai-refactoring-ui',
    'sddx-ai-ux-heuristics',
    'sddx-ai-web-typography',
  ],
  backend: [
    'sddx-ai-system-design',
    'sddx-ai-ddia-systems',
    'sddx-ai-clean-architecture',
    'sddx-ai-domain-driven-design',
    'sddx-ai-high-perf-browser',
    'sddx-grill-engineering-tdd',
    'sddx-ai-release-it',
  ],
  debugging: [
    'sddx-grill-engineering-diagnosing-bugs',
    'sddx-grill-engineering-triage',
    'sddx-ai-working-with-legacy-code',
    'sddx-ai-high-perf-browser',
    'sddx-ai-ddia-systems',
    'sddx-grill-engineering-tdd',
  ],
  devops: [
    'sddx-ai-release-it',
    'sddx-ai-system-design',
    'sddx-ai-ddia-systems',
    'sddx-grill-misc-setup-pre-commit',
    'sddx-grill-in-progress-setup-ts-deep-modules',
    'sddx-grill-misc-git-guardrails-claude-code',
    'sddx-ai-technical-documentation',
  ],
  documentation: [
    'sddx-ai-technical-documentation',
    'sddx-grill-productivity-writing-for-agents',
    'sddx-grill-productivity-handoff',
    'sddx-grill-engineering-to-spec',
    'sddx-grill-engineering-to-tickets',
  ],
};

export function availableProfiles() {
  return Object.keys(SKILL_PROFILES).sort();
}

export function resolveSkillSelection({ skills = '', profile = '', availableSkills = [] } = {}) {
  const requestedSkills = skills.split(',').map((item) => item.trim()).filter(Boolean);
  const requestedProfiles = profile.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  const knownSkills = new Set(availableSkills);
  const selected = new Set();

  for (const profileName of requestedProfiles) {
    const profileSkills = SKILL_PROFILES[profileName];
    if (!profileSkills) throw new Error(`Unknown skill profile: ${profileName}. Use: ${availableProfiles().join(', ')}.`);
    for (const skill of profileSkills) selected.add(skill);
  }

  for (const skill of requestedSkills) {
    if (skill.toLowerCase() === 'all') return { mode: 'all', profiles: requestedProfiles, skills: [...knownSkills].sort() };
    if (!knownSkills.has(skill)) throw new Error(`Unknown bundled skill: ${skill}. Use an id from sddx/capability-catalog.json.`);
    selected.add(skill);
  }

  if (selected.size === 0) return { mode: 'all', profiles: [], skills: [...knownSkills].sort() };
  const unavailable = [...selected].filter((skill) => !knownSkills.has(skill));
  if (unavailable.length > 0) throw new Error(`Skill profile contains unavailable skills: ${unavailable.join(', ')}.`);
  return { mode: 'selected', profiles: requestedProfiles, skills: [...selected].sort() };
}
