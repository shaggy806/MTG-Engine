import { defineCard } from "../define.js";

// EDHREC rank 3731.

export default defineCard({
  name: "Memory Erosion",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "Whenever an opponent casts a spell, that player mills two cards.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent" },
      targets: [],
      effect: { kind: "mill", target: "trigger-controller", amount: 2 },
      resolve: null,
      text: "Whenever an opponent casts a spell, that player mills two cards.",
    },
  ],
});
