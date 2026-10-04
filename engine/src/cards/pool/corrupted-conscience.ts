import { defineCard } from "../define.js";

// EDHREC rank 5926.
//
// Rulings:
//   [2011-06-01] Multiple instances of infect on the same creature are redundant.

export default defineCard({
  name: "Corrupted Conscience",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nYou control enchanted creature.\nEnchanted creature has infect. (It deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)",
  targets: ["creature"],
  // Mind Control's "You control enchanted creature."
  controlEnchanted: true,
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["infect"],
      text: "Enchanted creature has infect.",
    },
  ],
});
