import { defineCard } from "../define.js";

const MANA_TEXT =
  "Whenever you tap a land for mana, add one mana of any type that land produced. " +
  "(The types of mana are white, blue, black, red, green, and colorless.)";
const DRAW_TEXT = "Whenever you cast a creature spell, draw a card.";

// The mana half is a triggered mana ability (rule 605.1b) — see Mirari's
// Wake: a land making more than one type leaves the pick to the player (the
// ruling).
export default defineCard({
  name: "Zendikar Resurgent",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${MANA_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "add-mana", mana: "produced", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
