import { defineCard } from "../define.js";

export default defineCard({
  name: "Highland Game",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elk"],
  power: 2,
  toughness: 1,
  text: "When this creature dies, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "When this creature dies, you gain 2 life.",
    },
  ],
});
