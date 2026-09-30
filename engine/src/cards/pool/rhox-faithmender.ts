import { defineCard } from "../define.js";

const TEXT = "If you would gain life, you gain twice that much life instead.";

export default defineCard({
  name: "Rhox Faithmender",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Rhino", "Monk"],
  power: 1,
  toughness: 5,
  keywords: ["lifelink"],
  text: `Lifelink\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-gain-life", who: "you", multiplier: 2 },
      text: TEXT,
    },
  ],
});
