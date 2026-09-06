import { defineCard } from "../define.js";

export default defineCard({
  name: "Explorer's Insight",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text:
    "Look at the top 4 cards of your library. You may put one of them onto the battlefield. Put the rest on the bottom of your library in a random order.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 4,
    min: 0,
    max: 1,
    destination: "battlefield",
    leftover: "bottom-random",
  },
});
