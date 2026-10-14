import { CATEGORY_RISK, CLOSED } from './constants.js';

// priority = 40% AI severity + 30% community + 15% aging + 15% category risk (all 0-100)
export function computePriority(c) {
  if (CLOSED.includes(c.status)) return 0;
  const created = c.createdAt ? new Date(c.createdAt).getTime() : Date.now();
  const ageDays = (Date.now() - created) / 86_400_000;
  const community = (Math.min(c.confirmationCount || 0, 25) / 25) * 100;
  const aging = (Math.min(ageDays, 14) / 14) * 100;
  const risk = CATEGORY_RISK[c.category] ?? 30;
  return Math.round(0.4 * (c.aiSeverity || 0) + 0.3 * community + 0.15 * aging + 0.15 * risk);
}
