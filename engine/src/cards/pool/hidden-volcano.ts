import { defineCard } from "../define.js";

// EDHREC rank 3936.
//
// Rulings:
//   [2023-11-10] The mana value of a split card is determined by the combined mana cost of its two
//     halves. If discover allows you to cast a split card, you may cast either half (as long as
//     its mana value is less than or equal to the effect's discover value) but not both halves.
//   [2023-11-10] A spell's mana value is determined only by its mana cost. Ignore any alternative
//     costs, additional costs, cost increases, or cost reductions.
//   [2023-11-10] If you cast a spell "without paying its mana cost", you can't choose to cast it
//     for any alternative costs. You can, however, pay additional costs. If the spell has any
//     mandatory additional costs, you must pay those to cast it.
//   [2023-11-10] When you discover, you must exile cards. The only optional part of the ability is
//     whether you cast the exiled card or put it into your hand.
//   [2023-11-10] If you discover an adventurer card, split card, or modal double-faced card, you
//     might be able to cast that card with either set of characteristics depending on the effect's
//     discover value. For example, if you discover 4 and reveal Galvanic Giant (an adventurer card
//     from Wilds of Eldraine with a mana value of 4), you could cast Galvanic Giant, but not Storm
//     Reading (its Adventure, which has a mana value of 7). If you discover 7 and reveal Galvanic
//     Giant, you could cast either Galvanic Giant or Storm Reading.
//   [2023-11-10] If the discovered card has {X} in its mana cost, you must choose 0 as the value
//     of X when casting it without paying its mana cost.
//   [2023-11-10] You exile the cards face up. All players will be able to see them.
//   [2023-11-10] If you can't cast the discovered card (perhaps because there are no legal targets
//     for the spell), you'll put it into your hand.
//   [2023-11-10] Some spells and abilities that cause you to discover may require targets. If each
//     target chosen is an illegal target as that spell or ability tries to resolve, it won't
//     resolve and you won't discover.
//
// Discover 4 (rule 701.57a) is Hidden Nursery's shape: exile until a nonland
// card with mana value 4 or less, cast it free or put it into your hand, the
// rest on the bottom in a random order.
const DISCOVER_TEXT =
  "{4}{R}, {T}, Sacrifice this land: Discover 4. Activate only as a sorcery. (Exile cards from the top of your library until you exile a nonland card with mana value 4 or less. Cast it without paying its mana cost or put it into your hand. Put the rest on the bottom in a random order.)";

export default defineCard({
  name: "Hidden Volcano",
  colors: [],
  types: ["land"],
  subtypes: ["Cave"],
  text: `This land enters tapped.\n{T}: Add {R}.\n${DISCOVER_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: "{4}{R}", tap: true, sacrifice: "self" },
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
