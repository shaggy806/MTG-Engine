import { defineCard } from "../define.js";

// EDHREC rank 5897.

const DISCOVER_TEXT =
  "{4}{B}, {T}, Sacrifice this land: Discover 4. Activate only as a sorcery. (Exile cards from the top of your library until you exile a nonland card with mana value 4 or less. Cast it without paying its mana cost or put it into your hand. Put the rest on the bottom in a random order.)";

// Hidden Nursery's shape, in black.
export default defineCard({
  name: "Hidden Necropolis",
  colors: [],
  types: ["land"],
  subtypes: ["Cave"],
  text: `This land enters tapped.\n{T}: Add {B}.\n${DISCOVER_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
    {
      cost: { mana: "{4}{B}", tap: true, sacrifice: "self" },
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
