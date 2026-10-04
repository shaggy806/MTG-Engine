import { defineCard } from "../define.js";

// EDHREC rank 3251.
//
// Rulings:
//   [2016-06-08] Extract from Darkness doesn't target a creature card. You choose which card
//     you're putting onto the battlefield as it resolves. You can choose any creature card in a
//     graveyard at that time, including one just put into a graveyard by Extract from Darkness. If
//     there are no creature cards in graveyards at that time, Extract from Darkness simply
//     finishes resolving.

export default defineCard({
  name: "Extract from Darkness",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  types: ["sorcery"],
  text: "Each player mills two cards. Then you put a creature card from a graveyard onto the battlefield under your control.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "mill", target: "each-player", amount: 2 },
      {
        kind: "look-and-choose",
        zone: "graveyards",
        min: 1,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature" },
      },
    ],
  },
});
