import { defineCard } from "../define.js";

// EDHREC rank 3929.

export default defineCard({
  name: "Their Name Is Death",
  manaCost: "{3}{B}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy all nonartifact creatures.",
  effect: { kind: "destroy-all", filter: { type: "creature", notTypes: ["artifact"] } },
});
