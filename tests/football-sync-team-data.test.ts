import test from 'node:test';
import assert from 'node:assert/strict';
import { FootballDataProvider } from '@/lib/football/football-data-provider';
import { getTeamLogoUrl } from '@/lib/team-logo';

test('football-data fixtures expose full team metadata', async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () => ({
    ok: true,
    json: async () => ({
      matches: [
        {
          id: 100,
          competition: { id: 200 },
          utcDate: '2026-03-13T20:00:00Z',
          status: 'SCHEDULED',
          homeTeam: { id: 516, name: 'Manchester United', shortName: 'Man Utd', crest: 'https://cdn/mu.png' },
          awayTeam: { id: 519, name: 'Liverpool', shortName: 'Liverpool', crest: 'https://cdn/liv.png' },
          score: { fullTime: { home: null, away: null } },
        },
      ],
    }),
  })) as any;

  try {
    const provider = new FootballDataProvider();
    const fixtures = await provider.getFixtures({ from: '2026-03-13', to: '2026-03-13' });

    assert.equal(fixtures.length, 1);
    assert.equal(fixtures[0].homeTeamName, 'Manchester United');
    assert.equal(fixtures[0].homeTeamShortName, 'Man Utd');
    assert.equal(fixtures[0].homeTeamCrest, 'https://cdn/mu.png');
    assert.equal(fixtures[0].awayTeamName, 'Liverpool');
    assert.equal(fixtures[0].awayTeamShortName, 'Liverpool');
    assert.equal(fixtures[0].awayTeamCrest, 'https://cdn/liv.png');
  } finally {
    global.fetch = originalFetch;
  }
});

test('team logo resolver uses crestUrl before local fallback', () => {
  assert.equal(getTeamLogoUrl({ name: 'Arsenal', crestUrl: 'https://crest/arsenal.png' }), 'https://crest/arsenal.png');
  assert.equal(getTeamLogoUrl({ name: 'Real Madrid' }), '/teams/real-madrid.png');
});
