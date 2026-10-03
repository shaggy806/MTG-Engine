import { defineCard } from "../define.js";

// The creature type is chosen as Realmwalker enters (rule 614.12). Looking at
// the top card any time is for its controller alone (rule 401.5); a creature
// spell of the chosen type — a changeling is every type — comes off the top
// paying every cost and keeping its timing. With no type chosen it can still
// look, but casts nothing (the ruling).
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT = "You may cast creature spells of the chosen type from the top of your library.";

export default defineCard({
  name: "Realmwalker",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Shapeshifter"],
  power: 2,
  toughness: 3,
  keywords: ["changeling"],
  text: `Changeling (This card is every creature type.)\nAs this creature enters, choose a creature type.\n${LOOK_TEXT}\n${CAST_TEXT}`,
  chooseCreatureTypeOnEnter: true,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      castFromLibraryTop: { filter: { type: "creature", ofChosenType: true } },
      text: CAST_TEXT,
    },
  ],
});
