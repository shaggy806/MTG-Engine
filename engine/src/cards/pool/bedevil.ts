import { defineCard } from "../define.js";

export default defineCard({
  name: "Bedevil",
  manaCost: "{B}{B}{R}",
  colors: ["B", "R"],
  types: ["instant"],
  text: "Destroy target artifact, creature, or planeswalker.",
  targets: [
    { kind: "permanent", filter: { typesAnyOf: ["artifact", "creature", "planeswalker"] } },
  ],
  effect: { kind: "destroy", target: 0 },
});
