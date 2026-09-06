import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function loadCatalog(projectRoot) {
  const filePath = path.join(path.resolve(projectRoot), '.sddx', 'capability-catalog.json');
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function recommendSkills(projectRoot, {
  stage,
  roles = [],
  query = '',
  limit = 8,
  includeExternal = false,
}) {
  if (!stage) throw new Error('A workflow stage is required.');
  const catalog = await loadCatalog(projectRoot);
  const requestedRoles = roles.map((role) => role.toLowerCase()).filter(Boolean);
  const queryTerms = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const ranked = catalog.skills
    .filter((skill) => includeExternal || !skill.requiresExternalCli)
    .map((skill) => {
    const searchable = `${skill.id} ${skill.name} ${skill.description} ${skill.roles.join(' ')} ${skill.stages.join(' ')}`.toLowerCase();
    let score = 0;
    if (skill.stages.includes(stage)) score += 100;
    else score -= 80;
    score += requestedRoles.filter((role) => skill.roles.includes(role)).length * 35;
    score += queryTerms.filter((term) => searchable.includes(term)).length * 10;
    score += skill.priority?.[stage] ?? 0;
    if (skill.automatic) score += 2;
    return { ...skill, score };
    });

  return ranked
    .filter((skill) => skill.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit);
}
