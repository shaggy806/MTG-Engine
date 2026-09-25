import { defineCard } from "../define.js";

export default defineCard({
  name: "Strangle",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Strangle deals 3 damage to target creature or planeswalker.",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "damage", amount: 3, target: 0 },
});
