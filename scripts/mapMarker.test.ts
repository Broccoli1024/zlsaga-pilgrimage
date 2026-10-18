import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMarkerAppearance, getPinColor } from '../src/lib/mapMarker.ts';
const base = { categoryName: '温泉', checkedIn: true, favorite: false, showCheckins: true, routeMode: false, routeIndex: -1, matched: true };
test('hiding check-in marks restores the original category pin including favorites', () => {
  for (const favorite of [false, true]) {
    assert.deepEqual(getMarkerAppearance({ ...base, favorite, showCheckins: false }), getMarkerAppearance({ ...base, checkedIn: false }));
  }
  assert.equal(getMarkerAppearance(base).badge, '✓');
});
test('route candidates retain their category symbol, while selected stops retain order above nine', () => {
  assert.deepEqual(getMarkerAppearance({ ...base, checkedIn: false, routeMode: true }), { symbol: '♨️', badge: null, opacity: 0.45 });
  assert.deepEqual(getMarkerAppearance({ ...base, routeMode: true, routeIndex: 11, showCheckins: false }), { symbol: '♨️', badge: '12', opacity: 1 });
});
test('filtered markers stay dim and unknown categories have a fallback', () => {
  assert.equal(getMarkerAppearance({ ...base, matched: false, routeMode: true, routeIndex: 0 }).opacity, 0.25);
  assert.equal(getMarkerAppearance({ ...base, categoryName: 'new' }).symbol, '📍');
});

test('manhole color takes priority over sacred status', () => {
  assert.equal(getPinColor(true, true), getPinColor(false, true));
  assert.notEqual(getPinColor(false, true), getPinColor(false, false));
  assert.notEqual(getPinColor(true, true), getPinColor(true, false));
});
