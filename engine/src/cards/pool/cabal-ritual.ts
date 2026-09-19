import { defineCard } from "../define.js";

export default defineCard({
  name: "Cabal Ritual",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "Add {B}{B}{B}.\n" +
    "Threshold — Add {B}{B}{B}{B}{B} instead if there are seven or more cards in your graveyard.",
  effect: {
    kind: "conditional",
    condition: { kind: "threshold" },
    then: { kind: "add-mana", mana: "B", amount: 5 },
    else: { kind: "add-mana", mana: "B", amount: 3 },
  },
});
