import { defineCard } from "../define.js";

// Only the lands you control as it resolves gain it (rule 611.2c). A mana
// ability with no {T} is one the auto-payer can't plan with, so it's
// activated by hand and the {B} spent from the pool.
const GRANTED_TEXT = "Sacrifice this land: Add {B}.";

export default defineCard({
  name: "Rain of Filth",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: `Until end of turn, lands you control gain "${GRANTED_TEXT}"`,
  effect: {
    kind: "grant-activated-all",
    filter: { type: "land", controlledBy: "you" },
    ability: {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: GRANTED_TEXT,
    },
    duration: "end-of-turn",
  },
});
