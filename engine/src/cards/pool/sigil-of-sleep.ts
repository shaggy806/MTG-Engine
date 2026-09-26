import { defineCard } from "../define.js";

const TEXT =
  "Whenever enchanted creature deals damage to a player, return target creature that player controls to its owner's hand.";

export default defineCard({
  name: "Sigil of Sleep",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature\n${TEXT}`,
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "deals-damage", who: "attached", to: "player" },
      targets: [{ kind: "permanent", whose: "trigger-player", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
