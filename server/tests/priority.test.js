import test from 'node:test';
import assert from 'node:assert/strict';
import { computePriority } from '../utils/priority.js';

test('priority stays between zero and one hundred and closed reports have zero priority', () => {
  const open = computePriority({ status: 'reported', category: 'pothole', aiSeverity: 100, confirmationCount: 100, createdAt: new Date(Date.now() - 30 * 86400000) });
  assert.ok(open >= 0 && open <= 100);
  assert.equal(computePriority({ status: 'resolved', category: 'pothole', aiSeverity: 100 }), 0);
});

test('priority tolerates missing optional factors', () => {
  const score = computePriority({ status: 'reported', category: 'unknown' });
  assert.equal(Number.isFinite(score), true);
  assert.ok(score >= 0 && score <= 100);
});
