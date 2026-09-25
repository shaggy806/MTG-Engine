import { defineCard } from "../define.js";

export default defineCard({
  name: "Horizon Chimera",
  manaCost: "{2}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Chimera"],
  power: 3,
  toughness: 2,
  keywords: ["flash", "flying", "trample"],
  text: "Flash\nFlying, trample\nWhenever you draw a card, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever you draw a card, you gain 1 life.",
    },
  ],
});
