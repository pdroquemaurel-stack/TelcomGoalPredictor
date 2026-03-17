import { APP_CONFIG_DEFAULTS } from '@/lib/app-config';

export type DailyConfigLike = {
  dailyFutureDays?: number;
  dailyPastDays?: number;
};

export function normalizeDailyConfig(config: DailyConfigLike = {}) {
  return {
    dailyFutureDays: Math.max(1, config.dailyFutureDays ?? APP_CONFIG_DEFAULTS.dailyFutureDays),
    dailyPastDays: Math.max(0, config.dailyPastDays ?? APP_CONFIG_DEFAULTS.dailyPastDays),
  };
}

export function buildDailyBounds(now: Date, config: DailyConfigLike = {}) {
  const normalized = normalizeDailyConfig(config);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - normalized.dailyPastDays);

  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + normalized.dailyFutureDays);

  return { start, end };
}

export function buildThemeVariables(config: Partial<typeof APP_CONFIG_DEFAULTS>) {
  return {
    '--brand-primary': config.primaryColor ?? APP_CONFIG_DEFAULTS.primaryColor,
    '--brand-secondary': config.secondaryColor ?? APP_CONFIG_DEFAULTS.secondaryColor,
    '--brand-cta': config.ctaColor ?? APP_CONFIG_DEFAULTS.ctaColor,
    '--app-bg': config.backgroundColor ?? APP_CONFIG_DEFAULTS.backgroundColor,
    '--app-card': config.cardColor ?? APP_CONFIG_DEFAULTS.cardColor,
    '--app-text': config.textColor ?? APP_CONFIG_DEFAULTS.textColor,
  };
}
