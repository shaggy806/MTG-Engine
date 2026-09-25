import { defineCard } from "../define.js";

export default defineCard({
  name: "Whitesun's Passage",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "You gain 5 life.",
  effect: { kind: "gain-life", amount: 5 },
});
