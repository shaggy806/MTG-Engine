import { defineCard } from "../define.js";

// EDHREC rank 3976.
//
// Rulings:
//   [2017-09-29] If a seventh card is put into your graveyard by something other than resolving
//     Search for Azcanta's triggered ability, you won't transform it yet. You'll have to wait
//     until your next upkeep.
//   [2017-09-29] If you don't put the top card of your library into your graveyard while resolving
//     Search for Azcanta's triggered ability, you'll leave it on top of your library (and probably
//     draw it during your draw step).
//   [2017-09-29] If you have seven or more cards in your graveyard, you may transform Search for
//     Azcanta while resolving its triggered ability even if you choose not to put the top card of
//     your library into your graveyard.

export default defineCard({
  name: "Search for Azcanta",
  manaCost: "{1}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: "At the beginning of your upkeep, surveil 1. Then if you have seven or more cards in your graveyard, you may transform Search for Azcanta. (Look at the top card of your library. You may put that card into your graveyard.)",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      // The graveyard is counted after the surveil, as the ability resolves,
      // and the transform may be taken whether or not the card was milled.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "surveil", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "threshold" },
            then: { kind: "may", prompt: "Transform Search for Azcanta?", effect: { kind: "transform", target: "source" } },
          },
        ],
      },
      resolve: null,
      text: "At the beginning of your upkeep, surveil 1. Then if you have seven or more cards in your graveyard, you may transform Search for Azcanta.",
    },
  ],
  faces: ["Search for Azcanta", "Azcanta, the Sunken Ruin"],
  transform: true,
});
