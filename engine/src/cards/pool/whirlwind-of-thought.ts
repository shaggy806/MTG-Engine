import { defineCard } from "../define.js";

export default defineCard({
  name: "Whirlwind of Thought",
  manaCost: "{1}{U}{R}{W}",
  colors: ["W", "U", "R"],
  types: ["enchantment"],
  text: "Whenever you cast a noncreature spell, draw a card.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you cast a noncreature spell, draw a card.",
    },
  ],
});
