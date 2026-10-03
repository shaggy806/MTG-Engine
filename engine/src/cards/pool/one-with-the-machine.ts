import { defineCard } from "../define.js";

// Read as it resolves; an {X} in an artifact's mana cost is 0 there (its
// ruling, rule 202.3e). With no artifacts, it draws nothing.
export default defineCard({
  name: "One with the Machine",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw cards equal to the greatest mana value among artifacts you control.",
  effect: {
    kind: "draw",
    amount: { aggregate: "max", of: "mana-value", filter: { type: "artifact", controlledBy: "you" } },
  },
});
