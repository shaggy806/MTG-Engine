import { defineCard } from "../define.js";

// A modal double-faced card (instant // land) — its back face, Valakut
// Stoneforge, is a land you play instead.
//
// How many go to the bottom is chosen as it resolves (its ruling): any number
// of the cards in hand, in the order picked (`"library-bottom"` — the last
// picked lowest; rule 401.4). "That many" is the cards actually put there
// (`"put-on-bottom"` this way), so putting none still draws one (its ruling).
const TEXT =
  "Put any number of cards from your hand on the bottom of your library, then draw that many cards plus one.";

export default defineCard({
  name: "Valakut Awakening",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: { cardsInHand: "you" },
        destination: "library-bottom",
        leftover: "stay",
      },
      { kind: "draw", amount: { sum: [{ thisWay: "put-on-bottom", who: "you" }, 1] } },
    ],
  },
  faces: ["Valakut Awakening", "Valakut Stoneforge"],
});
