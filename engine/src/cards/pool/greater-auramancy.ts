import { defineCard } from "../define.js";

// EDHREC rank 2380.
//
// Rulings:
//   [2008-05-01] If you have two on the battlefield, they’ll each grant the other one shroud.

const ENCHANTMENTS_TEXT =
  "Other enchantments you control have shroud. (A permanent with shroud can't be the target of spells or abilities.)";
const CREATURES_TEXT = "Enchanted creatures you control have shroud.";

export default defineCard({
  name: "Greater Auramancy",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${ENCHANTMENTS_TEXT}\n${CREATURES_TEXT}`,
  static: [
    {
      // "Other": two of them give each other shroud (the ruling).
      affects: { scope: "filter", filter: { type: "enchantment", controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["shroud"],
      text: ENCHANTMENTS_TEXT,
    },
    {
      // Enchanted by any player's Aura (rule 303.4).
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", enchanted: true } },
      grantKeywords: ["shroud"],
      text: CREATURES_TEXT,
    },
  ],
});
