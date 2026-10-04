import { defineCard } from "../define.js";

// EDHREC rank 3600.
//
// Rulings:
//   [2016-06-08] If Regal Force is still on the battlefield as its triggered ability resolves, its
//     ability will count itself.

export default defineCard({
  name: "Regal Force",
  manaCost: "{4}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 5,
  text: "When this creature enters, draw a card for each green creature you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: { countOf: { type: "creature", colors: ["G"], controlledBy: "you" } } },
      resolve: null,
      text: "When this creature enters, draw a card for each green creature you control.",
    },
  ],
});
