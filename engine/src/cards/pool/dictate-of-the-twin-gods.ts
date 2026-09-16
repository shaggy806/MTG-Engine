import { defineCard } from "../define.js";

export default defineCard({
  name: "Dictate of the Twin Gods",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  keywords: ["flash"],
  text:
    "Flash\n" +
    "If a source would deal damage to a permanent or player, it deals double that damage to that permanent or player instead.",
  static: [
    {
      // Symmetric and global: it doubles damage from anyone to anyone, which
      // is why `affects` is irrelevant here.
      affects: { scope: "self" },
      replacement: { event: "would-deal-damage", multiplier: 2 },
      text: "If a source would deal damage to a permanent or player, it deals double that damage to that permanent or player instead.",
    },
  ],
});
