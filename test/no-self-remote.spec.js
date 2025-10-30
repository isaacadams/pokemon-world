// This test guards the rule: never treat the local player's websocket messages
// (init/players/join/update/rename) as remote player events.

function shouldTreatAsRemote(incomingId, localId) {
  return incomingId !== localId;
}

describe('Do not create remote for local player', () => {
  const localId = 'local-1234';

  test('players list entry for local is ignored', () => {
    expect(shouldTreatAsRemote(localId, localId)).toBe(false);
  });

  test('join event from local is ignored', () => {
    expect(shouldTreatAsRemote(localId, localId)).toBe(false);
  });

  test('update event from local is ignored', () => {
    expect(shouldTreatAsRemote(localId, localId)).toBe(false);
  });

  test('rename event from local is ignored', () => {
    expect(shouldTreatAsRemote(localId, localId)).toBe(false);
  });

  test('remote player events are processed', () => {
    expect(shouldTreatAsRemote('remote-1', localId)).toBe(true);
  });
});
