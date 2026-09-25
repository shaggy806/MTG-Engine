import { defineCard } from "../define.js";

export default defineCard({
  name: "Vedalken Archmage",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Vedalken", "Wizard"],
  power: 0,
  toughness: 2,
  text: "Whenever you cast an artifact spell, draw a card.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you cast an artifact spell, draw a card.",
    },
  ],
});
