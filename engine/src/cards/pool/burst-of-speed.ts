import { defineCard } from "../define.js";

export default defineCard({
  name: "Burst of Speed",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Creatures you control gain haste until end of turn. (They can attack and {T} even if they just came under your control.)",
  effect: {
    kind: "grant-keyword-all",
    filter: { type: "creature", controlledBy: "you" },
    keyword: "haste",
    duration: "end-of-turn",
  },
});
