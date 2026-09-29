import { defineCard } from "../define.js";

const TRIPLE_TEXT =
  "If a source you control would deal damage to a permanent or player, it deals triple that damage to that permanent or player instead.";

// Any recipient, your own permanents and you included. Damage divided or
// assigned (trample) is split first and tripled after (the rulings).
export default defineCard({
  name: "Fiery Emancipation",
  manaCost: "{3}{R}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TRIPLE_TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-deal-damage", multiplier: 3, source: { controlledBy: "you" } },
      text: TRIPLE_TEXT,
    },
  ],
});
