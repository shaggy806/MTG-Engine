import { defineCard } from "../define.js";

// EDHREC rank 4168.
//
// Rulings:
//   [2024-09-20] If no creatures have died in a turn by the time that turn's end step begins,
//     Séance Board's first ability won't trigger at all. Causing a creature to die during the end
//     step won't cause the ability to trigger.
//   [2024-09-20] If a spell has {X} in its mana cost, use the value chosen for X when determining
//     that spell's mana value.

const MORBID_TEXT =
  "Morbid — At the beginning of each end step, if a creature died this turn, put a soul counter on this artifact.";
const MANA_TEXT =
  "{T}: Add X mana of any one color, where X is the number of soul counters on this artifact. Spend this mana only to cast instant, sorcery, Demon, and Spirit spells.";

// `any-color` with an amount is that much of one colour (Resonating Lute).
export default defineCard({
  name: "Séance Board",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: `${MORBID_TEXT}\n${MANA_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: { countersOn: "source", counter: "soul" },
        spendOnly: {
          spell: { anyOf: [{ typesAnyOf: ["instant", "sorcery"] }, { subtypes: ["Demon", "Spirit"] }] },
          text: "Spend this mana only to cast instant, sorcery, Demon, and Spirit spells.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "creature-died-this-turn" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "soul", amount: 1 },
      resolve: null,
      text: MORBID_TEXT,
    },
  ],
});
