import { defineCard } from "../define.js";

export default defineCard({
  name: "Crossbow Ambush",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Creatures you control gain reach until end of turn. (They can block creatures with flying.)",
  effect: {
    kind: "grant-keyword-all",
    filter: { type: "creature", controlledBy: "you" },
    keyword: "reach",
    duration: "end-of-turn",
  },
});
