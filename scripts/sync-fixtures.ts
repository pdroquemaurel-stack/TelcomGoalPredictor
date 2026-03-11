import { syncCompetitions, syncFixtures } from '@/lib/sync';

(async () => {
  const now = new Date();
  const from = now.toISOString().slice(0, 10);
  const toDate = new Date(now);
  toDate.setDate(now.getDate() + 7);
  const to = toDate.toISOString().slice(0, 10);

  await syncCompetitions();
  await syncFixtures(from, to);
  console.log('Sync complete');
})();
