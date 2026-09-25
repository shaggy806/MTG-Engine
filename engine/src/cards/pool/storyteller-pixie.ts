import { defineCard } from "../define.js";

export default defineCard({
  name: "Storyteller Pixie",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever you cast an Adventure spell, draw a card.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Adventure" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you cast an Adventure spell, draw a card.",
    },
  ],
});
