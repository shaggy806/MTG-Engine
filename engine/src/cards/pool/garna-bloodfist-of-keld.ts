import { defineCard } from "../define.js";

// EDHREC rank 3677.
//
// "If it was attacking" reads the creature as it last existed on the
// battlefield (rule 603.10a — Zurgo Stormrender's shape): one that died in
// combat while attacking draws; any other death deals the damage.
const TEXT =
  "Whenever another creature you control dies, draw a card if it was attacking. Otherwise, Garna deals 1 damage to each opponent.";

export default defineCard({
  name: "Garna, Bloodfist of Keld",
  manaCost: "{1}{B}{R}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Berserker"],
  power: 4,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "trigger-object", filter: { attacking: true } },
        then: { kind: "draw", amount: 1 },
        else: { kind: "damage", amount: 1, who: "each-opponent" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
