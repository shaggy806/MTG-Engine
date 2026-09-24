import { defineCard } from "../define.js";

export default defineCard({
  name: "Dramatic Reversal",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Untap all nonland permanents you control.",
  effect: { kind: "untap-all", filter: { notTypes: ["land"], controlledBy: "you" } },
});
