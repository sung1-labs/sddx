export function parseSkillFrontmatter(contents) {
  const match = contents.match(/^---\n([\s\S]*?)\n---/);
  const values = {};
  for (const line of match?.[1]?.split('\n') ?? []) {
    const item = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (item) values[item[1]] = item[2].replace(/^['"]|['"]$/g, '');
  }
  return values;
}

export function cleanSkillName(source, directoryName, frontmatterName = '') {
  const name = frontmatterName || directoryName;
  if (source === 'openspec') return name.replace(/^openspec-/, '');
  if (source === 'ai-skills' || source === 'grill-skills') return name;
  return directoryName;
}

export function rewriteInstalledSkillName(contents, name) {
  if (!/^---\n/.test(contents) || !/^name:\s*.+$/m.test(contents)) return contents;
  return contents.replace(/^name:\s*.+$/m, `name: ${name}`);
}
