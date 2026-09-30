import { defineCard } from "../define.js";

export default defineCard({
  name: "Battle Hymn",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Add {R} for each creature you control.",
  effect: { kind: "add-mana", mana: "R", amount: { countOf: { type: "creature", controlledBy: "you" } } },
});
