import { defineCard } from "../define.js";

export default defineCard({
  name: "Riptide Crab",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Crab"],
  power: 1,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\nWhen this creature dies, draw a card.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When this creature dies, draw a card.",
    },
  ],
});
