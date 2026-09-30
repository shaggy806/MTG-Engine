import { defineCard } from "../define.js";

const TEXT = "If you would gain life, you gain twice that much life instead.";

export default defineCard({
  name: "Boon Reflection",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-gain-life", who: "you", multiplier: 2 },
      text: TEXT,
    },
  ],
});
