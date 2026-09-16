import { defineCard } from "../define.js";

export default defineCard({
  name: "Dawn of Hope",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "Whenever you gain life, you may pay {2}. If you do, draw a card.\n" +
    "{3}{W}: Create a 1/1 white Soldier creature token with lifelink.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {2} to draw a card?",
        cost: "{2}",
        effect: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "Whenever you gain life, you may pay {2}. If you do, draw a card.",
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{W}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Soldier Token", count: 1 },
      resolve: null,
      text: "{3}{W}: Create a 1/1 white Soldier creature token with lifelink.",
    },
  ],
});
