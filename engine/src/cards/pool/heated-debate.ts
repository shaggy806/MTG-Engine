import { defineCard } from "../define.js";

export default defineCard({
  name: "Heated Debate",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  cantBeCountered: true,
  text: "This spell can't be countered. (This includes by the ward ability.)\nHeated Debate deals 4 damage to target creature or planeswalker.",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "damage", amount: 4, target: 0 },
});
