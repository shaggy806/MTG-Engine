import { defineCard } from "../define.js";

// EDHREC rank 4586.
//
// Rulings:
//   [2021-04-16] In a multiplayer game, if creatures you control deal combat damage to multiple
//     opponents at the same time, the last ability will trigger multiple times. However, because
//     the counters are removed, it is difficult (but not impossible) to make multiple players lose
//     the game from this ability in the same combat phase.
//   [2021-04-16] If multiple creatures deal combat damage to you or an opponent at the same time,
//     the appropriate ability of Strixhaven Stadium will trigger that many times. You can put
//     these abilities on the stack in any order. The last ability put on the stack will be the
//     first to resolve.
//   [2021-04-16] “That player” refers to the opponent who was dealt damage.
//   [2021-04-16] The check for ten or more point counters happens only as the last ability is
//     resolving. Notably, if you add the tenth point counter some other way, no one will lose the
//     game . . . yet.

const MANA_TEXT = "{T}: Add {C}. Put a point counter on this artifact.";
const HIT_YOU = "Whenever a creature deals combat damage to you, remove a point counter from this artifact.";
const HIT_THEM =
  "Whenever a creature you control deals combat damage to an opponent, put a point counter on this artifact. Then if it has ten or more point counters on it, remove them all and that player loses the game.";

export default defineCard({
  name: "Strixhaven Stadium",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: `${MANA_TEXT}\n${HIT_YOU}\n${HIT_THEM}`,
  activated: [
    {
      // Eumidian Hatchery's shape: the counter rides on the mana ability.
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "C",
        amount: 1,
        also: { kind: "add-counter", target: "source", counter: "point", amount: 1 },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      // One trigger per creature that deals combat damage to you (the ruling).
      trigger: { on: "deals-damage", who: "any", filter: { type: "creature" }, to: "you", combat: true },
      targets: [],
      effect: { kind: "remove-counter", target: "source", counter: "point", amount: 1 },
      resolve: null,
      text: HIT_YOU,
    },
    {
      // "That player" is the opponent dealt the damage (the ruling) — the
      // trigger's player. The ten-counter check happens only as this resolves
      // (the ruling), read off the Stadium as it last existed if it has left.
      trigger: { on: "deals-damage", who: "you-control", filter: { type: "creature" }, to: "opponent", combat: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "point", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "self-counters", counter: "point", compare: { op: "gte", n: 10 } },
            then: {
              kind: "sequence",
              effects: [
                {
                  kind: "remove-counter",
                  target: "source",
                  counter: "point",
                  amount: { countersOn: "source", counter: "point" },
                },
                { kind: "lose-game", who: "trigger-player" },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: HIT_THEM,
    },
  ],
});
