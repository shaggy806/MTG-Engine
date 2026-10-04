import { defineCard } from "../define.js";

// EDHREC rank 3466.

const TEXT =
  "Whenever this creature deals combat damage to a player, you may destroy target artifact or enchantment that player controls.";

export default defineCard({
  name: "Trygon Predator",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [{ kind: "permanent", whose: "trigger-player", filter: { typesAnyOf: ["artifact", "enchantment"] } }],
      effect: {
        kind: "may",
        prompt: "Destroy the target artifact or enchantment?",
        effect: { kind: "destroy", target: 0 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
