import { defineCard } from "../define.js";

// "Their first noncreature spell each turn": that player's first noncreature
// spell of the turn, whatever they cast before it. X is this creature's power
// as the ability resolves — as it last existed, if it has left (rule 608.2h).
const TEXT =
  "Whenever an opponent casts their first noncreature spell each turn, draw a card unless that player pays {X}, " +
  "where X is this creature's power.";

export default defineCard({
  name: "Esper Sentinel",
  manaCost: "{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", firstEachTurn: true, filter: { notTypes: ["creature"] } },
      targets: [],
      effect: {
        kind: "unless",
        chooser: "trigger-controller",
        options: [{ payGeneric: { powerOf: "source" }, text: "Pay {X}." }],
        otherwise: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
