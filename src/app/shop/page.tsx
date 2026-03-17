import { redirect } from 'next/navigation';
import { requireOnboardedUser } from '@/lib/player-access';

export default async function ShopPage() {
  await requireOnboardedUser();
  redirect('/predictions');
}
