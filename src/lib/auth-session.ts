export function getSessionUserId(session: unknown): string | null {
  const userId = (session as any)?.user?.id as string | undefined;
  return userId ?? null;
}
