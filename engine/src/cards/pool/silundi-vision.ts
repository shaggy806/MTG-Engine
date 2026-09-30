import { defineCard } from "../define.js";

/** A modal double-faced card (instant // land) — its back face, Silundi
 * Isle, is a land you play instead. Only the card taken is revealed. */
export default defineCard({
  name: "Silundi Vision",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Look at the top six cards of your library. You may reveal an instant or sorcery card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 6,
    reveal: "chosen",
    min: 0,
    max: 1,
    destination: "hand",
    leftover: "bottom-random",
    filter: { typesAnyOf: ["instant", "sorcery"] },
  },
  faces: ["Silundi Vision", "Silundi Isle"],
});
