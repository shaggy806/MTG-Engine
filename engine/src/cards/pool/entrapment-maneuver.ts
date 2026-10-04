import { defineCard } from "../define.js";

// EDHREC rank 4608.
//
// Rulings:
//   [2016-11-08] If you cast Entrapment Maneuver after combat damage has been dealt, only
//     creatures that survived combat can be sacrificed.
//   [2016-11-08] Entrapment Maneuver doesn't target the creature to be sacrificed. The target
//     player chooses one as it resolves. No player may take any other actions between the target
//     player choosing the creature and you creating Soldier tokens.
//   [2016-11-08] To determine how many Soldier tokens are created, use the toughness of the
//     sacrificed creature as it last existed on the battlefield.
//   [2016-11-08] An "attacking creature" is one that has been declared as an attacker or put onto
//     the battlefield attacking during this combat. Unless that creature leaves combat, it
//     continues to be an attacking creature through the end of combat step, even if the player it
//     was attacking has left the game or the planeswalker it was attacking has left combat.
//
// Diabolic Edict's target-player edict narrowed to an attacking creature, then
// Reign of the Pit's "sacrificed this way" amount: X is the sacrificed
// creature's toughness as it last existed on the battlefield (the ruling).
// No attacking creature to sacrifice makes X 0.

const TEXT =
  "Target player sacrifices an attacking creature of their choice. You create X 1/1 white Soldier creature tokens, " +
  "where X is that creature's toughness.";

export default defineCard({
  name: "Entrapment Maneuver",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["instant"],
  text: TEXT,
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "sacrifice", who: "target", filter: { type: "creature", attacking: true }, count: 1 },
      { kind: "create-token", token: "Soldier Token", count: { thisWay: "sacrificed", sumOf: "toughness" } },
    ],
  },
});
