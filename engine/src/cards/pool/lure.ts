import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-4c — `must-be-blocked`. All of the defending player's
 * creatures that are able to block the enchanted creature are forced to
 * (rule 509.1c), checked in `whyCannotDeclareBlockers`.
 */
export default defineCard({
  name: "Lure",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: "Enchant creature\nAll creatures able to block enchanted creature do so.",
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      restrictions: ["must-be-blocked"],
      text: "All creatures able to block enchanted creature do so.",
    },
  ],
});
