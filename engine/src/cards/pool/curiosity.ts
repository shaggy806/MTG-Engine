import { defineCard } from "../define.js";

const TEXT = "Whenever enchanted creature deals damage to an opponent, you may draw a card.";

// "You" and "an opponent" are Curiosity's controller's — on an opponent's
// creature, damage it deals to you draws nothing. Any damage counts, once
// per time it deals damage (the rulings).
export default defineCard({
  name: "Curiosity",
  manaCost: "{U}",
  colors: ["U"],
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
