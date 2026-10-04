import { defineCard } from "../define.js";

// EDHREC rank 5385.
// "As long as this Aura entered this turn" reads the Aura's own
// `enteredThisTurn` (a `source` condition on the static).

const HEXPROOF_TEXT = "As long as this Aura entered this turn, enchanted creature has hexproof.";

export default defineCard({
  name: "Shardmage's Rescue",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  keywords: ["flash"],
  text: `Flash\nEnchant creature you control\n${HEXPROOF_TEXT}\nEnchanted creature gets +1/+1.`,
  targets: ["creature-you-control"],
  static: [
    {
      affects: { scope: "attached" },
      condition: { kind: "source", filter: { enteredThisTurn: true } },
      grantKeywords: ["hexproof"],
      text: HEXPROOF_TEXT,
    },
    { affects: { scope: "attached" }, grantPt: [1, 1], text: "Enchanted creature gets +1/+1." },
  ],
});
