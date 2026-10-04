import { defineCard } from "../define.js";

// EDHREC rank 5296.

export default defineCard({
  name: "Final Vengeance",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice a creature or enchantment.\nExile target creature.",
  additionalCost: { sacrifice: { typesAnyOf: ["creature", "enchantment"], controlledBy: "you" } },
  targets: ["creature"],
  effect: { kind: "exile", target: 0 },
});
