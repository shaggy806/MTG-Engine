import { defineCard } from "../define.js";

export default defineCard({
  name: "Simplify",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Each player sacrifices an enchantment of their choice.",
  effect: { kind: "sacrifice", who: "each-player", filter: { type: "enchantment" }, count: 1 },
});
