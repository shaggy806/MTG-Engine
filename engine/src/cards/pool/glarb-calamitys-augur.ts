import { defineCard } from "../define.js";

// #43 in top-commanders.txt.
//
// Looking at the top card any time is for Glarb's controller alone (the top
// card goes to their view only — rule 401.5). Lands come off the top with the
// land drop; a spell is judged as the spell it would be, so an X spell is
// castable only at an X that makes its mana value 4 or greater (the ruling),
// and every cost and timing rule still applies.
const LOOK_TEXT = "You may look at the top card of your library any time.";
const PLAY_TEXT = "You may play lands and cast spells with mana value 4 or greater from the top of your library.";

export default defineCard({
  name: "Glarb, Calamity's Augur",
  manaCost: "{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Frog", "Wizard", "Noble"],
  power: 2,
  toughness: 4,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${LOOK_TEXT}\n${PLAY_TEXT}\n{T}: Surveil 2.`,
  looksAtOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      playFromLibraryTop: { type: "land" },
      castFromLibraryTop: { filter: { manaValue: { op: "gte", n: 4 } } },
      text: PLAY_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "surveil", amount: 2 },
      resolve: null,
      text: "{T}: Surveil 2.",
    },
  ],
});
