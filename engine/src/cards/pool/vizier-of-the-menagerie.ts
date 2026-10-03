import { defineCard } from "../define.js";

// Looking at the top card any time is for its controller alone (rule 401.5).
// The any-type spending is for every creature spell its controller casts,
// wherever from — not only the top of the library (the ruling, rule 118.14).
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT = "You may cast creature spells from the top of your library.";
const SPEND_TEXT = "You can spend mana of any type to cast creature spells.";

export default defineCard({
  name: "Vizier of the Menagerie",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake", "Cleric"],
  power: 3,
  toughness: 4,
  text: `${LOOK_TEXT}\n${CAST_TEXT}\n${SPEND_TEXT}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      castFromLibraryTop: { filter: { type: "creature" } },
      text: CAST_TEXT,
    },
    {
      affects: { scope: "self" },
      spendManaAs: { as: "any-type", spell: { type: "creature" } },
      text: SPEND_TEXT,
    },
  ],
});
