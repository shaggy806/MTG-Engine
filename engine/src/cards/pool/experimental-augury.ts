import { defineCard } from "../define.js";

// The rest go on the bottom in an order the caster picks once the one is in
// hand (`"bottom-any-order"`); the proliferate comes after.
export default defineCard({
  name: "Experimental Augury",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Look at the top three cards of your library. Put one of them into your hand and the rest on the bottom of your library in any order. Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "look-and-choose",
        zone: "library",
        count: 3,
        min: 1,
        max: 1,
        destination: "hand",
        leftover: "bottom-any-order",
      },
      { kind: "proliferate" },
    ],
  },
});
