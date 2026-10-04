import { defineCard } from "../define.js";

// EDHREC rank ~6383 (between Scute Mob, 6381, and Oakhame Adversary, 6385).

const TEXT = "Whenever you attack with two or more creatures, draw a card.";

export default defineCard({
  name: "Military Intelligence",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
