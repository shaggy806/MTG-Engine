import { defineCard } from "../define.js";

// EDHREC rank 2897.
//
// Rulings:
//   [2021-07-23] An artifact's mana value is determined solely by the mana symbols printed in its
//     upper right corner. If its mana cost includes {X}, X is considered to be 0.
//   [2021-07-23] A token has a mana value of 0 unless it's copying something else.

const TEXT =
  "Magical Tinkering — {W}, {T}, Sacrifice an artifact: Search your library for an artifact card with mana value equal to 1 plus the sacrificed artifact's mana value, put it onto the battlefield, then shuffle. Activate only as a sorcery.";

export default defineCard({
  name: "Oswald Fiddlebender",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gnome", "Artificer"],
  power: 2,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{W}", tap: true, sacrifice: { filter: { type: "artifact" } } },
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
      sorcerySpeed: true,
    },
  ],
});
