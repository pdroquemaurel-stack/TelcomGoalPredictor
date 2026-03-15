export type GroupedFixtures<T extends { kickoff: string }> = {
  key: string;
  label: string;
  fixtures: T[];
};

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDayLabel(date: Date, now = new Date()) {
  const day = startOfDay(date).getTime();
  const today = startOfDay(now).getTime();
  const tomorrow = today + 24 * 60 * 60 * 1000;

  if (day === today) return 'Aujourd’hui';
  if (day === tomorrow) return 'Demain';

  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export function groupFixturesByDay<T extends { kickoff: string }>(fixtures: T[], now = new Date()): GroupedFixtures<T>[] {
  const ordered = [...fixtures].sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
  const groups = new Map<string, GroupedFixtures<T>>();

  for (const fixture of ordered) {
    const kickoffDate = new Date(fixture.kickoff);
    const key = dateKey(kickoffDate);
    const existing = groups.get(key);

    if (existing) {
      existing.fixtures.push(fixture);
      continue;
    }

    groups.set(key, {
      key,
      label: getDayLabel(kickoffDate, now),
      fixtures: [fixture],
    });
  }

  return [...groups.values()];
}
