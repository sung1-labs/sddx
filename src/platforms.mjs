export const PLATFORMS = {
  codex: {
    label: 'Codex',
    skillsDir: '.agents/skills',
  },
  claude: {
    label: 'Claude Code',
    skillsDir: '.claude/skills',
  },
  cursor: {
    label: 'Cursor',
    skillsDir: '.cursor/skills',
  },
  copilot: {
    label: 'GitHub Copilot',
    skillsDir: '.github/skills',
  },
  windsurf: {
    label: 'Windsurf',
    skillsDir: '.windsurf/skills',
  },
  opencode: {
    label: 'OpenCode',
    skillsDir: '.opencode/skills',
  },
  generic: {
    label: 'Generic Agent Skills',
    skillsDir: '.agents/skills',
  },
};

export function parsePlatformList(value) {
  if (!value) return [];
  const names = value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  const unknown = names.filter((name) => !PLATFORMS[name]);
  if (unknown.length > 0) {
    throw new Error(`Unknown platform(s): ${unknown.join(', ')}. Use: ${Object.keys(PLATFORMS).join(', ')}`);
  }
  return [...new Set(names)];
}

export function formatPlatformChoices() {
  return Object.entries(PLATFORMS)
    .map(([id, platform], index) => `${index + 1}. ${platform.label} (${id})`)
    .join('\n');
}
