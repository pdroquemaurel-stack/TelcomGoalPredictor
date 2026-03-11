import { FootballDataProvider } from './football-data-provider';
import { FootballProvider } from './types';

export function footballProvider(): FootballProvider {
  return new FootballDataProvider();
}
