import { defineCard } from "../define.js";

export default defineCard({
  name: "Nourish",
  manaCost: "{G}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "You gain 6 life.",
  effect: { kind: "gain-life", amount: 6 },
});
