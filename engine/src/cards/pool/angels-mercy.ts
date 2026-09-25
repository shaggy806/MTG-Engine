import { defineCard } from "../define.js";

export default defineCard({
  name: "Angel's Mercy",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "You gain 7 life.",
  effect: { kind: "gain-life", amount: 7 },
});
