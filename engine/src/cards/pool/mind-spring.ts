import { defineCard } from "../define.js";

export default defineCard({
  name: "Mind Spring",
  manaCost: "{X}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw X cards.",
  effect: { kind: "draw", amount: "x" },
});
