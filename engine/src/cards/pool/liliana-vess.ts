import { defineCard } from "../define.js";

// EDHREC rank 4818.
//
// Rulings:
//   [2009-10-01] A “creature card” is any card with the type creature, even if it has other types
//     such as artifact, enchantment, or land. Older cards of type summon are also creature cards.

export default defineCard({
  name: "Liliana Vess",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Liliana"],
  loyalty: 5,
  text: "+1: Target player discards a card.\n−2: Search your library for a card, then shuffle and put that card on top.\n−8: Put all creature cards from all graveyards onto the battlefield under your control.",
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "+1: Target player discards a card.",
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [],
      // "A card" names no quality, so a card is found if there is one (rule
      // 701.23b) — `min: 1`, as Insatiable Avarice. `library-top` moves it
      // after the search's shuffle (Vampiric Tutor).
      effect: { kind: "search-library", filter: {}, destination: "library-top", min: 1, max: 1 },
      resolve: null,
      text: "−2: Search your library for a card, then shuffle and put that card on top.",
    },
    {
      loyaltyCost: -8,
      cost: { mana: null, tap: false },
      targets: [],
      // Grimoire of the Dead's shape: every creature card in every graveyard,
      // all at once, under your control.
      effect: {
        kind: "return-from-graveyard",
        from: "all-graveyards",
        filter: { type: "creature" },
        destination: "battlefield",
        count: "all",
      },
      resolve: null,
      text: "−8: Put all creature cards from all graveyards onto the battlefield under your control.",
    },
  ],
});
