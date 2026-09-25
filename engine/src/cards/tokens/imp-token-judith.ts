import { defineCard } from "../define.js";

/** Judith, Carnage Connoisseur's 2/2 red Imp. */
const TEXT = "When this token dies, it deals 2 damage to each opponent.";

export default defineCard({
  name: "Imp Token (Judith)",
  art: "47a1385b-2be2-49a8-8400-186cd5525dad",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Imp"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "each-opponent" },
      resolve: null,
      text: TEXT,
    },
  ],
});
