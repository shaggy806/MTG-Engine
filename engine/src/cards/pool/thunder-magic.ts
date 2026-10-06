import { defineCard } from "../define.js";

// Tiered (rule 702.183a): "Choose one. As an additional cost to cast this
// spell, pay the cost associated with that mode." — spree's machinery
// (`spreeCost`, rule 702.172a) with exactly one mode. The cost is paid on top
// of a free cast too, and the mana value stays {R}'s (the rulings).
const THUNDER = "• Thunder — {0} — Thunder Magic deals 2 damage to target creature.";
const THUNDARA = "• Thundara — {3} — Thunder Magic deals 4 damage to target creature.";
const THUNDAGA = "• Thundaga — {5}{R} — Thunder Magic deals 8 damage to target creature.";

export default defineCard({
  name: "Thunder Magic",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  text: `Tiered (Choose one additional cost.)\n${THUNDER}\n${THUNDARA}\n${THUNDAGA}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: THUNDER,
        spreeCost: "{0}",
        targets: ["creature"],
        effect: { kind: "damage", target: 0, amount: 2 },
      },
      {
        text: THUNDARA,
        spreeCost: "{3}",
        targets: ["creature"],
        effect: { kind: "damage", target: 0, amount: 4 },
      },
      {
        text: THUNDAGA,
        spreeCost: "{5}{R}",
        targets: ["creature"],
        effect: { kind: "damage", target: 0, amount: 8 },
      },
    ],
  },
});
