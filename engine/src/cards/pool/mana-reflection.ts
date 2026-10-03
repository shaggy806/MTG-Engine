import { defineCard } from "../define.js";

const TEXT = "If you tap a permanent for mana, it produces twice as much of that mana instead.";

// A replacement on the mana a {T} mana ability makes (rules 106.12, 106.12b):
// the tapped permanent's own mana only — never a "whenever you tap … for
// mana" triggered mana ability's — each unit with whatever restriction or
// rider it carries, and several compound (the rulings).
export default defineCard({
  name: "Mana Reflection",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "tap-for-mana", multiplier: 2 },
      text: TEXT,
    },
  ],
});
