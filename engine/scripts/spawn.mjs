// Shared white-box "put this card straight onto the battlefield" helper for the
// playground scripts. Kept in one place so it doesn't drift from GameObject.

export const makeSpawn =
  (game) =>
  (cardName, controller, opts = {}) => {
    const id = `demo-${game.state.nextObjectSeq}`;
    game.state.nextObjectSeq += 1;
    game.state.timestampSeq += 1;
    game.state.objects[id] = {
      id,
      cardName,
      owner: controller,
      controller,
      zone: "battlefield",
      tapped: opts.tapped ?? false,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: opts.sick ? game.state.turn.number : 0,
      summoningSick: opts.sick ?? false,
      targets: null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "card",
      abilityKind: null,
      sourceObjectId: null,
      abilityIndex: null,
      counters: {},
      modifiers: [],
      timestamp: game.state.timestampSeq,
      isToken: false,
      attachedTo: null,
    };
    game.state.zones.shared.battlefield.push(id);
    return id;
  };
