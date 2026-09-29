import { defineCard } from "../define.js";

const ANTHEM_TEXT = "Colorless creatures you control get +2/+2.";
const MANA_TEXT = "Whenever you tap a permanent for {C}, add an additional {C}.";
const LIFE_TEXT = "Whenever you cast a colorless spell, you gain 2 life.";

// Tapping a permanent for more than one {C} still adds just one more, and
// only a mana ability with {T} in its cost counts (the rulings) — the
// `tapped-for-mana` trigger's `producing: "C"`.
export default defineCard({
  name: "Forsaken Monument",
  manaCost: "{5}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${ANTHEM_TEXT}\n${MANA_TEXT}\n${LIFE_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", colorless: true } },
      grantPt: [2, 2],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "you-control", producing: "C" },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { colorless: true } },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
});
