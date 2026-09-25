import { defineCard } from "../define.js";

export default defineCard({
  name: "Primordial Sage",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 4,
  toughness: 5,
  text: "Whenever you cast a creature spell, you may draw a card.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever you cast a creature spell, you may draw a card.",
    },
  ],
});
