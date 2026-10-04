import { defineCard } from "../define.js";

// EDHREC rank 3884.

export default defineCard({
  name: "Extinguish All Hope",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy all nonenchantment creatures.",
  effect: { kind: "destroy-all", filter: { type: "creature", notTypes: ["enchantment"] } },
});
