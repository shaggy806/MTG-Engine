import { defineCard } from "../define.js";

export default defineCard({
  name: "Damnation",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy all creatures. They can't be regenerated.",
  effect: { kind: "destroy-all", filter: { type: "creature" } },
});
