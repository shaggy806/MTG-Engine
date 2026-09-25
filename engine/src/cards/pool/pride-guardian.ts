import { defineCard } from "../define.js";

export default defineCard({
  name: "Pride Guardian",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Monk"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\nWhenever this creature blocks, you gain 3 life.",
  triggered: [
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "Whenever this creature blocks, you gain 3 life.",
    },
  ],
});
