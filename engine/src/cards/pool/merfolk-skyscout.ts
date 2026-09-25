import { defineCard } from "../define.js";

export default defineCard({
  name: "Merfolk Skyscout",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Scout"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks or blocks, untap target permanent.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["permanent"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "Whenever this creature attacks or blocks, untap target permanent.",
    },
    {
      trigger: { on: "blocks", who: "self" },
      targets: ["permanent"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "Whenever this creature attacks or blocks, untap target permanent.",
    },
  ],
});
