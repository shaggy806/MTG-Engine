import { defineCard } from "../define.js";

// EDHREC rank 6551.

export default defineCard({
  name: "Plague Wind",
  manaCost: "{7}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy all creatures you don't control. They can't be regenerated.",
  effect: {
    kind: "destroy-all",
    filter: { type: "creature", controlledBy: "opponent" },
    cantBeRegenerated: true,
  },
});
