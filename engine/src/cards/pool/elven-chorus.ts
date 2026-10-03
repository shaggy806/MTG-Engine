import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// Looking at the top card any time is for its controller alone (rule 401.5).
// A creature spell cast from the top pays every cost and keeps its timing
// (the rulings).
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT = "You may cast creature spells from the top of your library.";
const MANA_TEXT = 'Creatures you control have "{T}: Add one mana of any color."';

export default defineCard({
  name: "Elven Chorus",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${LOOK_TEXT}\n${CAST_TEXT}\n${MANA_TEXT}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      castFromLibraryTop: { filter: { type: "creature" } },
      text: CAST_TEXT,
    },
    {
      affects: { scope: "creatures-you-control" },
      grantsActivated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
      text: MANA_TEXT,
    },
  ],
});
