import { defineCard } from "../define.js";

export default defineCard({
  name: "Dreadbore",
  manaCost: "{B}{R}",
  colors: ["B", "R"],
  types: ["sorcery"],
  text: "Destroy target creature or planeswalker.",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "destroy", target: 0 },
});
