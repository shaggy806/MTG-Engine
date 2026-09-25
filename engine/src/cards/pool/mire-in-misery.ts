import { defineCard } from "../define.js";

export default defineCard({
  name: "Mire in Misery",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each opponent sacrifices a creature or enchantment of their choice.",
  effect: {
    kind: "sacrifice",
    who: "each-opponent",
    filter: { typesAnyOf: ["creature", "enchantment"] },
    count: 1,
  },
});
