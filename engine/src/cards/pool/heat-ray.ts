import { defineCard } from "../define.js";

export default defineCard({
  name: "Heat Ray",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Heat Ray deals X damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: "x", target: 0 },
});
