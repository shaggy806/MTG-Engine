import { defineCard } from "../define.js";

// EDHREC rank 6360.
//
// Rulings:
//   [2020-06-23] See the Truth doesn't give you permission to cast it from a zone other than your
//     hand. You'll need to find another way to do so.
//   [2020-06-23] If an effect copies See the Truth while it's on the stack, the copy wasn't cast
//     at all, so you only get one of the cards it has you look at.

// "Cast from anywhere other than your hand" needs it to have been cast at
// all: a copy wasn't cast, so it takes the one-card branch (2020-06-23
// ruling). Approach of the Second Sun's `castFrom` condition.
export default defineCard({
  name: "See the Truth",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Look at the top three cards of your library. Put one of those cards into your hand and the rest on the bottom of your library in any order. If this spell was cast from anywhere other than your hand, put each of those cards into your hand instead.",
  effect: {
    kind: "conditional",
    condition: {
      kind: "all",
      of: [
        { kind: "source", filter: { cast: true } },
        { kind: "not", of: { kind: "source", filter: { castFrom: "hand" } } },
      ],
    },
    then: {
      kind: "look-and-choose",
      zone: "library",
      count: 3,
      min: 3,
      max: 3,
      destination: "hand",
      leftover: "bottom-any-order",
    },
    else: {
      kind: "look-and-choose",
      zone: "library",
      count: 3,
      min: 1,
      max: 1,
      destination: "hand",
      leftover: "bottom-any-order",
    },
  },
});
