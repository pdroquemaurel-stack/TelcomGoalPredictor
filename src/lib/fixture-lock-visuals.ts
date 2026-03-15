export type FixtureLockVisualState = {
  showLock: boolean;
  overlayClassName: string;
  lockClassName: string;
};

const LOCK_OVERLAY_CLASS = 'absolute inset-0 z-10 rounded-xl bg-zinc-900/45';
const LOCK_BADGE_CLASS = 'absolute right-2 top-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-zinc-950/90 text-sm';

export function getFixtureLockVisualState(isLocked: boolean): FixtureLockVisualState {
  return {
    showLock: isLocked,
    overlayClassName: LOCK_OVERLAY_CLASS,
    lockClassName: LOCK_BADGE_CLASS,
  };
}
