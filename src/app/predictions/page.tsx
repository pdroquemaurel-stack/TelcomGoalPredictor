import { PredictionsClient } from '@/app/predictions/predictions-client';
import { requireOnboardedUser } from '@/lib/player-access';

export const dynamic = 'force-dynamic';

export default async function PredictionsPage() {
  await requireOnboardedUser();
  return <PredictionsClient />;
}
