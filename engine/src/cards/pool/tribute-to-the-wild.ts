import { defineCard } from "../define.js";

export default defineCard({
  name: "Tribute to the Wild",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Each opponent sacrifices an artifact or enchantment of their choice.",
  effect: {
    kind: "sacrifice",
    who: "each-opponent",
    filter: { typesAnyOf: ["artifact", "enchantment"] },
    count: 1,
  },
});
