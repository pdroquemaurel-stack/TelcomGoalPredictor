import { FriendRequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function createOrAcceptFriendship(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) {
    return { status: 'INVALID' as const, message: 'Vous ne pouvez pas vous inviter vous-même.' };
  }

  const direct = await prisma.friendship.findUnique({
    where: { requesterId_addresseeId: { requesterId, addresseeId } },
  });

  if (direct?.status === FriendRequestStatus.ACCEPTED) {
    return { status: 'ALREADY_FRIENDS' as const, message: 'Vous êtes déjà amis.' };
  }

  if (direct?.status === FriendRequestStatus.PENDING) {
    return { status: 'PENDING' as const, message: 'Invitation déjà envoyée.' };
  }

  const reverse = await prisma.friendship.findUnique({
    where: { requesterId_addresseeId: { requesterId: addresseeId, addresseeId: requesterId } },
  });

  if (reverse?.status === FriendRequestStatus.ACCEPTED) {
    return { status: 'ALREADY_FRIENDS' as const, message: 'Vous êtes déjà amis.' };
  }

  if (reverse?.status === FriendRequestStatus.PENDING) {
    await prisma.friendship.update({
      where: { id: reverse.id },
      data: { status: FriendRequestStatus.ACCEPTED },
    });
    return { status: 'ACCEPTED' as const, message: 'Invitation acceptée.' };
  }

  await prisma.friendship.create({
    data: { requesterId, addresseeId, status: FriendRequestStatus.PENDING },
  });
  return { status: 'SENT' as const, message: 'Invitation envoyée.' };
}
