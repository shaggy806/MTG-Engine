import { defineCard } from "../define.js";

// EDHREC rank 4075.
//
// Rulings:
//   [2021-02-05] The last activated ability doesn't target any creature cards in graveyards. You
//     may return a creature card that was just milled or one that was already there.

export default defineCard({
  name: "Port of Karfell",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {U}.\n{3}{U}{B}{B}, {T}, Sacrifice this land: Mill four cards, then return a creature card from your graveyard to the battlefield tapped. (To mill a card, put the top card of your library into your graveyard.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
    {
      cost: { mana: "{3}{U}{B}{B}", tap: true, sacrifice: "self" },
      targets: [],
      // Blossoming Tortoise's shape: untargeted, any creature card there (one just
      // milled or one already there — the ruling), chosen as it resolves.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 4 },
          { kind: "return-from-graveyard", filter: { type: "creature" }, destination: "battlefield", count: 1, enterTapped: true },
        ],
      },
      resolve: null,
      text: "{3}{U}{B}{B}, {T}, Sacrifice this land: Mill four cards, then return a creature card from your graveyard to the battlefield tapped.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
