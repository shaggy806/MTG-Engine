import { defineCard } from "../define.js";

export default defineCard({
  name: "Sear",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Sear deals 4 damage to target creature or planeswalker.",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "damage", amount: 4, target: 0 },
});
