import { defineCard } from "../define.js";

// EDHREC rank 6626.
//
// Rulings:
//   [2025-11-17] Because damage remains marked on creatures until the damage is removed as the
//     turn ends, nonlethal damage dealt to a creature you control may become lethal if that
//     creature becomes untapped or if Adept Watershaper leaves the battlefield during that turn.
//
// The Wandering Rescuer's tapped-creature static, granting indestructible.
const TEXT = "Other tapped creatures you control have indestructible.";

export default defineCard({
  name: "Adept Watershaper",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Merfolk", "Cleric"],
  power: 3,
  toughness: 4,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", tapped: true }, excludeSelf: true },
      grantKeywords: ["indestructible"],
      text: TEXT,
    },
  ],
});
