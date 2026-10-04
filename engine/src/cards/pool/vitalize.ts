import { defineCard } from "../define.js";

// EDHREC rank 3555.

export default defineCard({
  name: "Vitalize",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Untap all creatures you control.",
  effect: { kind: "untap-all", filter: { type: "creature", controlledBy: "you" } },
});
