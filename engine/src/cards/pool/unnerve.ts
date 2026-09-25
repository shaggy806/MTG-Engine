import { defineCard } from "../define.js";

export default defineCard({
  name: "Unnerve",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each opponent discards two cards.",
  effect: { kind: "discard", target: "each-opponent", amount: 2 },
});
