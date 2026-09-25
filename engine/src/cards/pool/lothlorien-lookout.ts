import { defineCard } from "../define.js";

export default defineCard({
  name: "Lothlórien Lookout",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Scout"],
  power: 1,
  toughness: 3,
  text: "Whenever this creature attacks, scry 1.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "Whenever this creature attacks, scry 1.",
    },
  ],
});
