import fs from 'fs';
import path from 'path';
import { BADGE_IMAGE_FALLBACK, getBadgeImagePath } from '@/lib/badges';

export function resolveBadgeImagePath(slug: string) {
  if (!slug) return BADGE_IMAGE_FALLBACK;
  const absolute = path.join(process.cwd(), 'public', 'badges', `${slug}.webp`);
  return getBadgeImagePath(slug, fs.existsSync(absolute));
}
