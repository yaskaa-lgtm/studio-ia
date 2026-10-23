import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quote } from '../src/simulator.ts';

test('one-off quotes use the cheapest published combination', () => {
  assert.deepEqual([1, 2].map((n) => quote(n, false).total), [149, 298]);
  assert.equal(quote(3, false).plan, 'Lancement');
  assert.equal(quote(3, false).total, 390);
  assert.equal(quote(5, false).total, 390 + 2 * 120);
});
test('monthly picks Mensuel from 4 videos', () => {
  assert.equal(quote(4, true).plan, 'Mensuel');
  assert.equal(quote(4, true).total, 490);
  assert.equal(quote(6, true).total, 490 + 2 * 120);
  assert.equal(quote(3, true).plan, 'Lancement');
});
test('per-video price is total / n rounded', () => {
  for (let n = 1; n <= 12; n++) for (const m of [false, true]) {
    const q = quote(n, m);
    assert.equal(q.perVideo, Math.round(q.total / n));
    assert.ok(q.total > 0);
  }
});
