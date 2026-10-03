import { defineCard } from "../define.js";

const TEXT = "If you tap a permanent for mana, it produces three times as much of that mana instead.";

// See Mana Reflection: the same replacement, three times over (rules 106.12,
// 106.12b; two Nyxbloom Ancients make nine times as much — the ruling).
export default defineCard({
  name: "Nyxbloom Ancient",
  manaCost: "{4}{G}{G}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 5,
  keywords: ["trample"],
  text: `Trample\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "tap-for-mana", multiplier: 3 },
      text: TEXT,
    },
  ],
});
