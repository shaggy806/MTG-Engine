import { defineCard } from "../define.js";

// The rest go on the bottom in an order the caster picks once the two are in
// hand (`"bottom-any-order"`).
export default defineCard({
  name: "Dig Through Time",
  manaCost: "{6}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Delve (Each card you exile from your graveyard while casting this spell pays for {1}.)\n" +
    "Look at the top seven cards of your library. Put two of them into your hand and the rest on the bottom of your library in any order.",
  delve: true,
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 7,
    min: 2,
    max: 2,
    destination: "hand",
    leftover: "bottom-any-order",
  },
});
