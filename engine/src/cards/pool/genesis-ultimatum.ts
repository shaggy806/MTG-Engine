import { defineCard } from "../define.js";

export default defineCard({
  name: "Genesis Ultimatum",
  manaCost: "{G}{G}{U}{U}{U}{R}{R}",
  colors: ["G", "U", "R"],
  types: ["sorcery"],
  text:
    "Look at the top five cards of your library. Put any number of permanent cards " +
    "from among them onto the battlefield and the rest into your hand.\n" +
    "Exile Genesis Ultimatum.",
  exileOnResolve: true,
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 5,
    min: 0,
    max: 5,
    destination: "battlefield",
    leftover: "hand",
    filter: { notTypes: ["instant", "sorcery"] },
  },
});
