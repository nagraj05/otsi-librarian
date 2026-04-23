export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const unique = [...new Set(dates)].sort((a, b) => (a > b ? -1 : 1));

  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecent = new Date(unique[0] + 'T00:00:00');
  if (mostRecent < yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const curr = new Date(unique[i]     + 'T00:00:00');
    const prev = new Date(unique[i - 1] + 'T00:00:00');
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
