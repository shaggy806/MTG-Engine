import { defineCard } from "../define.js";

export default defineCard({
  name: "Chambered Nautilus",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Nautilus", "Beast"],
  power: 2,
  toughness: 2,
  text: "Whenever this creature becomes blocked, you may draw a card.",
  triggered: [
    {
      trigger: { on: "becomes-blocked", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever this creature becomes blocked, you may draw a card.",
    },
  ],
});
