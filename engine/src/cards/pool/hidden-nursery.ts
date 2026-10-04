import { defineCard } from "../define.js";

// EDHREC rank 3664.
//
// Rulings:
//   [2023-11-10] You exile the cards face up. All players will be able to see them.
//   [2023-11-10] If you can't cast the discovered card (perhaps because there are no legal targets
//     for the spell), you'll put it into your hand.
//   [2023-11-10] When you discover, you must exile cards. The only optional part of the ability is
//     whether you cast the exiled card or put it into your hand.
//   [2023-11-10] If the discovered card has {X} in its mana cost, you must choose 0 as the value of
//     X when casting it without paying its mana cost.
//
// Discover 4 (rule 701.57a) is Hit the Mother Lode's discover shape at 4:
// exile until a nonland card with mana value 4 or less, cast it free or put
// it into your hand, the rest on the bottom in a random order.
const DISCOVER_TEXT =
  "{4}{G}, {T}, Sacrifice this land: Discover 4. Activate only as a sorcery. (Exile cards from the top of your library until you exile a nonland card with mana value 4 or less. Cast it without paying its mana cost or put it into your hand. Put the rest on the bottom in a random order.)";

export default defineCard({
  name: "Hidden Nursery",
  colors: [],
  types: ["land"],
  subtypes: ["Cave"],
  text: `This land enters tapped.\n{T}: Add {G}.\n${DISCOVER_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: "{4}{G}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "reveal-until",
        filter: { notTypes: ["land"], manaValue: { op: "lte", n: 4 } },
        exile: true,
        keepFound: true,
        rest: "bottom-random",
        then: {
          kind: "cast-now",
          target: 0,
          free: true,
          spell: { manaValue: { op: "lte", n: 4 } },
          else: { kind: "return-to-hand", target: 0, from: "exile" },
        },
      },
      resolve: null,
      text: DISCOVER_TEXT,
      sorcerySpeed: true,
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
