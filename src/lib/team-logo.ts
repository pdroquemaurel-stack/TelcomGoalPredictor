export function normalizeTeamNameToLogoFile(teamName: string) {
  return teamName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getTeamLogoUrl(team: { name: string; logoUrl?: string | null; crestUrl?: string | null }) {
  if (team.logoUrl) return team.logoUrl;
  if (team.crestUrl) return team.crestUrl;
  const normalized = normalizeTeamNameToLogoFile(team.name);
  return `/teams/${normalized}.png`;
}

export function getTeamInitials(teamName: string) {
  const parts = teamName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}
