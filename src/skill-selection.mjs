export const SKILL_PROFILES = {
  sdlc: [
    'grilling', 'research', 'continuous-discovery', 'system-design',
    'clean-architecture', 'domain-driven-design', 'to-spec', 'implement',
    'tdd', 'clean-code', 'code-review', 'diagnosing-bugs', 'triage',
    'release-it', 'technical-documentation',
  ],
  product: [
    'grilling', 'research', 'continuous-discovery', 'inspired-product',
    'jobs-to-be-done', 'mom-test', 'lean-ux',
  ],
  architecture: [
    'system-design', 'ddia-systems', 'clean-architecture',
    'domain-driven-design', 'design-code-architecture', 'codebase-design',
    'domain-modeling',
  ],
  frontend: [
    'design-everyday-things', 'design-sprint', 'ios-hig-design',
    'microinteractions', 'refactoring-ui', 'ux-heuristics', 'web-typography',
  ],
  backend: [
    'system-design', 'ddia-systems', 'clean-architecture',
    'domain-driven-design', 'high-perf-browser', 'tdd', 'release-it',
  ],
  debugging: [
    'diagnosing-bugs', 'triage', 'working-with-legacy-code',
    'high-perf-browser', 'ddia-systems', 'tdd',
  ],
  devops: [
    'release-it', 'system-design', 'ddia-systems', 'setup-pre-commit',
    'setup-ts-deep-modules', 'git-guardrails-claude-code',
    'technical-documentation',
  ],
  documentation: [
    'technical-documentation', 'writing-for-agents', 'handoff', 'to-spec',
    'to-tickets',
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
