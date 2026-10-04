import { defineCard } from "../define.js";

// EDHREC rank 3491.
//
// Rulings:
//   [2008-05-01] Each land you control will have the land types Plains, Island, Swamp, Mountain,
//     and Forest. They’ll also have the mana ability of each basic land type (for example, Forests
//     can tap to produce {G}). They’ll still have their other subtypes and abilities.
//   [2008-05-01] Giving a land extra basic land types doesn’t change its name or whether it’s
//     legendary or basic.

export default defineCard({
  name: "Prismatic Omen",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Lands you control are every basic land type in addition to their other types.",
  // Dryad of the Ilysian Grove's shape: the basic land types bring their
  // mana abilities with them (the ruling).
  static: [
    {
      affects: { scope: "filter", filter: { type: "land", controlledBy: "you" } },
      addSubtypes: ["Plains", "Island", "Swamp", "Mountain", "Forest"],
      text: "Lands you control are every basic land type in addition to their other types.",
    },
  ],
});
