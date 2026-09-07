import { defineCard } from "../define.js";

export default defineCard({
  name: "Gut Shot",
  manaCost: "{R/P}",
  colors: ["R"],
  types: ["instant"],
  text: "({R/P} can be paid with either {R} or 2 life.)\nGut Shot deals 1 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 1, target: 0 },
});
