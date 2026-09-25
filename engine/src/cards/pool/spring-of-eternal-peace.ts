import { defineCard } from "../define.js";

export default defineCard({
  name: "Spring of Eternal Peace",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "You gain 8 life.",
  effect: { kind: "gain-life", amount: 8 },
});
