import { defineCard } from "../define.js";

// A `draws` trigger fires once per card, so an opponent drawing three offers
// three separate "draw two"s.
export default defineCard({
  name: "Consecrated Sphinx",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 4,
  toughness: 6,
  keywords: ["flying"],
  text: "Flying\nWhenever an opponent draws a card, you may draw two cards.",
  triggered: [
    {
      trigger: { on: "draws", who: "opponent" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw two cards?",
        effect: { kind: "draw", amount: 2 },
      },
      resolve: null,
      text: "Whenever an opponent draws a card, you may draw two cards.",
    },
  ],
});
