import { defineCard } from "../define.js";

export default defineCard({
  name: "Fracture",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["instant"],
  text: "Destroy target artifact, enchantment, or planeswalker.",
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["artifact", "enchantment", "planeswalker"] } }],
  effect: { kind: "destroy", target: 0 },
});
