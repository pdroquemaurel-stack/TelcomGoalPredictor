import { redirect } from 'next/navigation';
import { requireOnboardedUser } from '@/lib/player-access';

export default async function FriendsPage() {
  await requireOnboardedUser();
  redirect('/leaderboards?scope=friends&period=all-time');
}
