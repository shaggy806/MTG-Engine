import { defineCard } from "../define.js";

export default defineCard({
  name: "Grisly Salvage",
  manaCost: "{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text:
    "Reveal the top five cards of your library. You may put a creature or land card from among " +
    "them into your hand. Put the rest into your graveyard.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 5,
    reveal: true,
    min: 0,
    max: 1,
    destination: "hand",
    leftover: "graveyard",
    filter: { typesAnyOf: ["creature", "land"] },
  },
});
