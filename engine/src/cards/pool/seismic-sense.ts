import { defineCard } from "../define.js";

// EDHREC rank 4499.
//
// X — the lands you control — is read as the look happens.

export default defineCard({
  name: "Seismic Sense",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Look at the top X cards of your library, where X is the number of lands you control. You may reveal a creature or land card from among them and put it into your hand. Put the rest on the bottom of your library in a random order.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: { countOf: { type: "land", controlledBy: "you" } },
    reveal: "chosen",
    min: 0,
    max: 1,
    filter: { typesAnyOf: ["creature", "land"] },
    destination: "hand",
    leftover: "bottom-random",
  },
});
