import { defineCard } from "../define.js";

// Looking at the top card any time is for its controller alone (rule 401.5).
// The token trigger is for every Merfolk spell you cast, from anywhere, and
// resolves before the spell (the rulings).
const LOOK_TEXT = "You may look at the top card of your library any time.";
const CAST_TEXT = "You may cast Merfolk spells from the top of your library.";
const TOKEN_TEXT = "Whenever you cast a Merfolk spell, you may pay {1}. If you do, create a 1/1 blue Merfolk creature token.";

export default defineCard({
  name: "Emperor Mihail II",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Noble"],
  power: 3,
  toughness: 3,
  text: `${LOOK_TEXT}\n${CAST_TEXT}\n${TOKEN_TEXT}`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      castFromLibraryTop: { filter: { subtype: "Merfolk" } },
      text: CAST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Merfolk" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1} to create a 1/1 blue Merfolk creature token?",
        cost: "{1}",
        effect: { kind: "create-token", token: "Merfolk Token", count: 1 },
      },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
