import test from 'node:test';
import assert from 'node:assert/strict';
import { getDayLabel, groupFixturesByDay } from '@/lib/fixture-grouping';

test('groupFixturesByDay groups and sorts fixtures by kickoff day/time', () => {
  const now = new Date('2026-04-10T10:00:00.000Z');
  const fixtures = [
    { id: '3', kickoff: '2026-04-11T18:00:00.000Z' },
    { id: '1', kickoff: '2026-04-10T20:00:00.000Z' },
    { id: '2', kickoff: '2026-04-10T12:00:00.000Z' },
  ];

  const groups = groupFixturesByDay(fixtures, now);
  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.label, 'Aujourd’hui');
  assert.deepEqual(groups[0]?.fixtures.map((fixture) => fixture.id), ['2', '1']);
  assert.equal(groups[1]?.label, 'Demain');
});

test('getDayLabel returns formatted label outside today/tomorrow', () => {
  const label = getDayLabel(new Date('2026-04-15T10:00:00.000Z'), new Date('2026-04-10T10:00:00.000Z'));
  assert.match(label, /15/);
});
