import { defineCard } from "../define.js";

export default defineCard({
  name: "Goldenglow Moth",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 0,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature blocks, you may gain 4 life.",
  triggered: [
    {
      trigger: { on: "blocks", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Gain 4 life?", effect: { kind: "gain-life", amount: 4 } },
      resolve: null,
      text: "Whenever this creature blocks, you may gain 4 life.",
    },
  ],
});
