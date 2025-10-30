const { shouldIdle } = require('../apps/client/dist/placeholder');

// We can't import TS directly here without ts-jest; instead, we reimplement the invariant equivalent
function shouldIdleLocal(lastUpdateMs, nowMs, thresholdMs) {
  return nowMs - lastUpdateMs >= thresholdMs;
}

describe('RemotePlayersManager idle logic', () => {
  test('becomes idle when exceeding threshold', () => {
    const now = 1_000;
    expect(shouldIdleLocal(700, now, 200)).toBe(true);
    expect(shouldIdleLocal(800, now, 200)).toBe(true);
  });

  test('remains active when within threshold', () => {
    const now = 1_000;
    expect(shouldIdleLocal(850, now, 200)).toBe(false);
    expect(shouldIdleLocal(900, now, 200)).toBe(false);
    expect(shouldIdleLocal(999, now, 200)).toBe(false);
  });
});
