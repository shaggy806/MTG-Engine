import { defineCard } from "../define.js";

// EDHREC rank 3773. Oswald Fiddlebender's shape, with "another" artifact.
//
// Rulings:
//   [2025-02-07] If there's an {X} in the sacrificed artifact's mana cost, X is 0 when determining
//     its mana value.
const TEXT =
  "{2}, {T}, Sacrifice another artifact: Search your library for an artifact card with mana value equal to 1 plus the sacrificed artifact's mana value, put that card onto the battlefield, then shuffle. Activate only as a sorcery.";

export default defineCard({
  name: "Repurposing Bay",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: { filter: { type: "artifact" } } },
      otherOnly: true,
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "search-library",
        filter: {
          type: "artifact",
          manaValue: { op: "eq", n: { amount: { sum: [{ manaValueOf: "sacrificed" }, 1] } } },
        },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
