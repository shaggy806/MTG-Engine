import { defineCard } from "../define.js";
import { ravenous } from "../helpers.js";

// EDHREC rank 4835.
//
// Rulings:
//   [2022-10-07] A creature with ravenous gets its counters as it enters the battlefield. It
//     doesn't enter the battlefield first and then get its counters. Any triggered ability that
//     looks for a creature with a certain power or toughness entering the battlefield will see the
//     counters when it checks to see if it should trigger.
//   [2022-10-07] The triggered ability that checks to see if X is 5 or greater refers to the value
//     of X that was chosen as the spell was cast, which may be different from the number of
//     counters it entered with if there are replacement effects involved. This is also true for
//     any other ability that it has which refers to X and triggers when it enters the battlefield.
//   [2022-10-07] If a permanent spell with ravenous is copied, the copy will have the same value
//     for X, and the token permanent that the spell becomes as it enters the battlefield will
//     enter with X counters.
//   [2022-10-07] If another permanent enters the battlefield as a copy of a creature with
//     Ravenous, it will not enter with any counters from the ravenous ability.

// X is the X it was cast with (Farmer Cotton's shape), 0 if it entered
// without being cast: ravenous's counters and the Spore Chimney search both
// read it.
const RAVENOUS = ravenous();
const CHIMNEY_TEXT =
  "Spore Chimney — When this creature enters, search your library for up to X basic land cards, put them onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Sporocyst",
  manaCost: "{X}{X}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Tyranid"],
  power: 0,
  toughness: 0,
  keywords: ["defender"],
  text: `Ravenous (This creature enters with X +1/+1 counters on it. If X is 5 or more, draw a card when it enters.)\nDefender\n${CHIMNEY_TEXT}`,
  static: [RAVENOUS.static],
  triggered: [
    RAVENOUS.triggered,
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        min: 0,
        max: "x",
        enterTapped: true,
      },
      resolve: null,
      text: CHIMNEY_TEXT,
    },
  ],
});
