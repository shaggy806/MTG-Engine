import { defineCard } from "../define.js";

const TEXT = "Whenever enchanted creature deals damage to an opponent, you may draw a card.";

// "An opponent" is Ophidian Eye's controller's (the ruling).
export default defineCard({
  name: "Ophidian Eye",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: `Flash (You may cast this spell any time you could cast an instant.)\nEnchant creature\n${TEXT}`,
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
