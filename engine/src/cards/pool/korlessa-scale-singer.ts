import { defineCard } from "../define.js";

// Looking at the top card any time is for Korlessa's controller alone (rule
// 401.5). A Dragon spell cast from the top pays every cost and keeps its
// timing (the rulings).
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT = "You may cast Dragon spells from the top of your library.";

export default defineCard({
  name: "Korlessa, Scale Singer",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Bard"],
  power: 1,
  toughness: 4,
  text: `${LOOK_TEXT}\n${CAST_TEXT}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      castFromLibraryTop: { filter: { subtype: "Dragon" } },
      text: CAST_TEXT,
    },
  ],
});
