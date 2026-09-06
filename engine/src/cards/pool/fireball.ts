import { defineCard } from "../define.js";

export default defineCard({
  name: "Fireball",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Fireball deals X damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: "x", target: 0 },
});
