import { defineCard } from "../define.js";

// EDHREC rank 4577.

export default defineCard({
  name: "Annul",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target artifact or enchantment spell.",
  targets: [{ kind: "spell", filter: { typesAnyOf: ["artifact", "enchantment"] } }],
  effect: { kind: "counter", target: 0 },
});
