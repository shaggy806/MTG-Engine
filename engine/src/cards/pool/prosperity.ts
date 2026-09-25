import { defineCard } from "../define.js";

export default defineCard({
  name: "Prosperity",
  manaCost: "{X}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Each player draws X cards.",
  effect: { kind: "draw", amount: "x", who: "each-player" },
});
