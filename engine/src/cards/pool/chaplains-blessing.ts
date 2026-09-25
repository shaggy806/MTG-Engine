import { defineCard } from "../define.js";

export default defineCard({
  name: "Chaplain's Blessing",
  manaCost: "{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "You gain 5 life.",
  effect: { kind: "gain-life", amount: 5 },
});
