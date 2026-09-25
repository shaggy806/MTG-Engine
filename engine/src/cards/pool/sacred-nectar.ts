import { defineCard } from "../define.js";

export default defineCard({
  name: "Sacred Nectar",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "You gain 4 life.",
  effect: { kind: "gain-life", amount: 4 },
});
