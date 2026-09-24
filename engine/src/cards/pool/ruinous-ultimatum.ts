import { defineCard } from "../define.js";

export default defineCard({
  name: "Ruinous Ultimatum",
  manaCost: "{R}{R}{W}{W}{W}{B}{B}",
  colors: ["W", "B", "R"],
  types: ["sorcery"],
  text: "Destroy all nonland permanents your opponents control.",
  effect: {
    kind: "destroy-all",
    filter: { notTypes: ["land"], controlledBy: "opponent" },
  },
});
