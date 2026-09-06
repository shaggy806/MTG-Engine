import { defineCard } from "../define.js";

export default defineCard({
  name: "Blaze",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Blaze deals X damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: "x", target: 0 },
});
