export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const levelFromPoints = (points: number) => {
  if (points >= 250) return 'Legend';
  if (points >= 150) return 'Predictor';
  if (points >= 80) return 'Analyst';
  if (points >= 30) return 'Fan';
  return 'Rookie';
};
