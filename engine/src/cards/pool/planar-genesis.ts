import { defineCard } from "../define.js";

export default defineCard({
  name: "Planar Genesis",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  types: ["instant"],
  text:
    "Look at the top four cards of your library. You may put a land card from among them onto the " +
    "battlefield tapped. If you don't, put a card from among them into your hand. Put the rest on " +
    "the bottom of your library in a random order.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 4,
    min: 0,
    max: 1,
    filter: { type: "land" },
    destination: "battlefield",
    enterTapped: true,
    secondPick: { min: 1, max: 1, destination: "hand", ifNoneChosen: true },
    leftover: "bottom-random",
  },
});
