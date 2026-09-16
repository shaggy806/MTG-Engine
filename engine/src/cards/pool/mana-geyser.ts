import { defineCard } from "../define.js";

export default defineCard({
  name: "Mana Geyser",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Add {R} for each tapped land your opponents control.",
  effect: {
    kind: "add-mana",
    mana: "R",
    amount: { countOf: { type: "land", tapped: true, controlledBy: "opponent" } },
  },
});
