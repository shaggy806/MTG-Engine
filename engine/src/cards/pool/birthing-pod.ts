import { defineCard } from "../define.js";

const TEXT =
  "{1}{G/P}, {T}, Sacrifice a creature: Search your library for a creature card with mana value equal to 1 plus the sacrificed creature's mana value, put that card onto the battlefield, then shuffle. Activate only as a sorcery.";

// Eldritch Evolution's shape: the mana value is the sacrificed creature's as
// it last existed.
export default defineCard({
  name: "Birthing Pod",
  manaCost: "{3}{G/P}",
  colors: ["G"],
  types: ["artifact"],
  text: `({G/P} can be paid with either {G} or 2 life.)\n${TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{G/P}", tap: true, sacrifice: "creature-you-control" },
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "search-library",
        filter: {
          type: "creature",
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
