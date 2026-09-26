import { defineCard } from "../define.js";

const TEXT = "Whenever enchanted creature deals damage to an opponent, you may draw a card.";

// "You" and "an opponent" are Keen Sense's controller's (the rulings).
export default defineCard({
  name: "Keen Sense",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${TEXT}`,
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "deals-damage", who: "attached", to: "opponent" },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
