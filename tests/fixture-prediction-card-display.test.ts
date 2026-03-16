import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FixturePredictionCard } from '@/components/fixture-prediction-card';

const baseProps = {
  fixtureId: 'f-1',
  kickoff: '2026-03-20T18:00:00.000Z',
  competition: 'CAF Demo',
  home: 'Lions FC',
  homeLogoUrl: 'https://example.com/home.png',
  away: 'Eagles FC',
  awayLogoUrl: 'https://example.com/away.png',
  savedPrediction: { homeScore: 1, awayScore: 0 },
};

test('past fixture hides prediction values in main score box to avoid duplicate display', () => {
  const html = renderToStaticMarkup(createElement(FixturePredictionCard, {
    ...baseProps,
    editable: false,
    finalScore: { homeScore: 2, awayScore: 1 },
    isPastFixture: true,
    points: 3,
  }));

  assert.match(html, /data-score-box-mode="history-placeholder"/);
  assert.match(html, /data-testid="past-score-display"/);
  assert.doesNotMatch(html, /data-score-box-mode="prediction"/);
});

test('past fixture keeps enriched score format with player prediction around final score', () => {
  const html = renderToStaticMarkup(createElement(FixturePredictionCard, {
    ...baseProps,
    editable: false,
    finalScore: { homeScore: 2, awayScore: 1 },
    isPastFixture: true,
    points: 1,
  }));

  assert.match(html, /\(1\)/);
  assert.match(html, />2<\/span><span class="text-zinc-500">-<\/span><span class="text-xl/);
  assert.match(html, /\(0\)/);
});

test('upcoming editable fixture keeps prediction inputs', () => {
  const html = renderToStaticMarkup(createElement(FixturePredictionCard, {
    ...baseProps,
    editable: true,
    finalScore: null,
    isPastFixture: false,
  }));

  assert.match(html, /data-score-box-mode="inputs"/);
  assert.match(html, /<input/);
});

test('predictions page wires past tab into card past-fixture mode', async () => {
  const source = await readFile('src/app/predictions/predictions-client.tsx', 'utf8');
  assert.match(source, /isPastFixture=\{tab === 'past'\}/);
});

test('challenge page wires past tab into card past-fixture mode', async () => {
  const source = await readFile('src/app/challenges/[slug]/challenge-fixtures-client.tsx', 'utf8');
  assert.match(source, /isPastFixture=\{tab === 'past'\}/);
});
