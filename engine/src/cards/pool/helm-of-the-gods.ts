import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 4858.
//
// Rulings:
//   [2015-06-22] If you cast an Aura spell targeting a permanent controlled by an opponent, you
//     still control that Aura. It will count toward the bonus given by Helm of the Gods.

// Ethereal Armor's count: every enchantment you control, your Auras on an
// opponent's permanents included (the ruling).
const TEXT = "Equipped creature gets +1/+1 for each enchantment you control.";

export default defineCard({
  name: "Helm of the Gods",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TEXT}\nEquip {1} ({1}: Attach to target creature you control. Equip only as a sorcery.)`,
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { filter: { type: "enchantment", controlledBy: "you" }, pt: [1, 1] },
      text: TEXT,
    },
  ],
  activated: [equip("{1}")],
});
